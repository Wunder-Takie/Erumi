/**
 * BatchManager.ts
 * 이름 배치 추천 관리 모듈
 * 
 * v7.0: 전체 티어 우선 방식
 * - 150개 이상: 100개 티어 (1-50 → 51-100 → 한자 대안)
 * - 150개 미만: 60개 티어 (1-30 → 31-60 → 한자 대안)
 * 
 * 추출 순서:
 * 1. 전체 티어(1-100)에서 고유 한글 이름 (중복 한글 스킵)
 * 2. 전체 티어(1-100)에서 한자 대안 (같은 한글, 다른 한자)
 * 3. 다음 티어(101-200)로 이동
 */

import { EvaluationResult } from './llmEvaluator';

// ==========================================
// Types
// ==========================================

export interface BatchNameCandidate {
    hangulName: string;      // 한글 이름 (예: "서준")
    hanjaName: string;       // 한자 이름 (예: "瑞俊")
    hanja1?: { hangul: string; hanja: string; meaning_korean?: string };
    hanja2?: { hangul: string; hanja: string; meaning_korean?: string };
    score: number;
    rank: number;
    gender?: 'M' | 'F' | 'N';
    llmScore?: EvaluationResult;
    isExcludedAsOld?: boolean;
}

export interface BatchResult {
    names: BatchNameCandidate[];
    hasMore: boolean;
    totalUsed: number;
    isExhausted: boolean;
}

export interface BatchManagerState {
    candidates: BatchNameCandidate[];
    usedHangul: Set<string>;              // 사용된 한글 이름
    usedCombinations: Set<string>;        // 사용된 한글+한자 조합
    currentTierStart: number;             // 현재 티어 시작 인덱스
    tierSize: number;                     // 티어 크기 (100 또는 60)
    phase: 'unique_hangul' | 'hanja_alt'; // 현재 추출 단계
    currentSearchIndex: number;           // 현재 탐색 인덱스 (티어 내)
    surname: string;
}

// ==========================================
// BatchManager Class
// ==========================================

export class BatchManager {
    private state: BatchManagerState;

    constructor(candidates: BatchNameCandidate[], surname: string) {
        // 150개 이상이면 티어 100개, 미만이면 60개
        const tierSize = candidates.length >= 150 ? 100 : 60;

        this.state = {
            candidates: this.sortByScore(candidates),
            usedHangul: new Set(),
            usedCombinations: new Set(),
            currentTierStart: 0,
            tierSize,
            phase: 'unique_hangul',
            currentSearchIndex: 0,
            surname
        };
    }

    /**
     * 다음 배치 가져오기 (기본 5개)
     */
    async getNextBatch(batchSize: number = 5, useLLM: boolean = true): Promise<BatchResult> {
        const extracted: BatchNameCandidate[] = [];

        while (extracted.length < batchSize && !this.isExhausted()) {
            const candidate = this.extractNextCandidate();
            if (candidate) {
                this.markAsUsed(candidate);
                extracted.push(candidate);
            }
        }

        if (extracted.length === 0) {
            return {
                names: [],
                hasMore: false,
                totalUsed: this.state.usedCombinations.size,
                isExhausted: true
            };
        }

        // 점수 기반 정렬
        const sorted = extracted.sort((a, b) => b.score - a.score);

        return {
            names: sorted,
            hasMore: !this.isExhausted(),
            totalUsed: this.state.usedCombinations.size,
            isExhausted: this.isExhausted()
        };
    }

    /**
     * 고갈 여부 확인
     */
    isExhausted(): boolean {
        return this.state.currentTierStart >= this.state.candidates.length;
    }

    /**
     * 현재 상태 가져오기 (저장용)
     */
    getState(): {
        usedHangul: string[];
        usedCombinations: string[];
        currentTierStart: number;
        phase: string;
        currentSearchIndex: number;
    } {
        return {
            usedHangul: Array.from(this.state.usedHangul),
            usedCombinations: Array.from(this.state.usedCombinations),
            currentTierStart: this.state.currentTierStart,
            phase: this.state.phase,
            currentSearchIndex: this.state.currentSearchIndex
        };
    }

    /**
     * 상태 복원 (이전 세션에서)
     */
    restoreState(savedState: {
        usedHangul: string[];
        usedCombinations: string[];
        currentTierStart: number;
        phase: string;
        currentSearchIndex: number;
    }): void {
        this.state.usedHangul = new Set(savedState.usedHangul);
        this.state.usedCombinations = new Set(savedState.usedCombinations);
        this.state.currentTierStart = savedState.currentTierStart;
        this.state.phase = savedState.phase as 'unique_hangul' | 'hanja_alt';
        this.state.currentSearchIndex = savedState.currentSearchIndex;
    }

    // ==========================================
    // Private Methods
    // ==========================================

    private sortByScore(candidates: BatchNameCandidate[]): BatchNameCandidate[] {
        return [...candidates]
            .sort((a, b) => b.score - a.score)
            .map((c, i) => ({ ...c, rank: i + 1 }));
    }

    /**
     * 현재 티어의 후보 범위 가져오기
     */
    private getCurrentTier(): BatchNameCandidate[] {
        const start = this.state.currentTierStart;
        const end = Math.min(start + this.state.tierSize, this.state.candidates.length);
        return this.state.candidates.slice(start, end);
    }

    /**
     * 다음 후보 추출
     */
    private extractNextCandidate(): BatchNameCandidate | null {
        const tier = this.getCurrentTier();

        if (tier.length === 0) {
            return null;
        }

        if (this.state.phase === 'unique_hangul') {
            // Phase 1: 고유 한글 이름 우선 (같은 한글 스킵)
            for (let i = this.state.currentSearchIndex; i < tier.length; i++) {
                const candidate = tier[i];
                const combKey = this.getCombinationKey(candidate);

                // 이미 사용된 조합이면 스킵
                if (this.state.usedCombinations.has(combKey)) {
                    continue;
                }

                // 같은 한글 이름이 이미 사용됐으면 스킵 (한자 대안 phase에서 처리)
                if (this.state.usedHangul.has(candidate.hangulName)) {
                    continue;
                }

                // 찾음! 다음 탐색 위치 저장
                this.state.currentSearchIndex = i + 1;
                return candidate;
            }

            // 현재 티어에서 고유 한글 이름 소진 → 한자 대안 phase로 전환
            this.state.phase = 'hanja_alt';
            this.state.currentSearchIndex = 0;
            return this.extractNextCandidate();
        } else {
            // Phase 2: 한자 대안 (같은 한글, 다른 한자)
            for (let i = this.state.currentSearchIndex; i < tier.length; i++) {
                const candidate = tier[i];
                const combKey = this.getCombinationKey(candidate);

                // 이미 사용된 조합이면 스킵
                if (this.state.usedCombinations.has(combKey)) {
                    continue;
                }

                // 찾음! (한글이 같아도 한자가 다르면 OK)
                this.state.currentSearchIndex = i + 1;
                return candidate;
            }

            // 현재 티어 완전 소진 → 다음 티어로 이동
            return this.moveToNextTier();
        }
    }

    /**
     * 다음 티어로 이동
     */
    private moveToNextTier(): BatchNameCandidate | null {
        const nextTierStart = this.state.currentTierStart + this.state.tierSize;

        if (nextTierStart >= this.state.candidates.length) {
            // 모든 티어 소진
            this.state.currentTierStart = this.state.candidates.length;
            return null;
        }

        // 다음 티어로 이동하고 재귀 호출
        this.state.currentTierStart = nextTierStart;
        this.state.phase = 'unique_hangul';
        this.state.currentSearchIndex = 0;
        return this.extractNextCandidate();
    }

    private getCombinationKey(candidate: BatchNameCandidate): string {
        return `${candidate.hangulName}-${candidate.hanjaName}`;
    }

    private markAsUsed(candidate: BatchNameCandidate): void {
        this.state.usedHangul.add(candidate.hangulName);
        this.state.usedCombinations.add(this.getCombinationKey(candidate));
    }
}

// ==========================================
// Factory Function
// ==========================================

export function createBatchManager(candidates: BatchNameCandidate[], surname: string): BatchManager {
    return new BatchManager(candidates, surname);
}

export default BatchManager;
