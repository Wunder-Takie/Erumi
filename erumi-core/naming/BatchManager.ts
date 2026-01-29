/**
 * BatchManager.ts
 * 이름 배치 추천 관리 모듈
 * 
 * 윈도우 기반 추출:
 * - 150개 이상: 50개 윈도우 (1-50, 51-100, ...)
 * - 150개 미만: 30개 윈도우 (1-30, 31-60, ...)
 * 
 * 추출 순서:
 * 1. 현재 윈도우에서 새 한글 이름
 * 2. 현재 윈도우에서 한자 대안 (같은 한글, 다른 한자)
 * 3. 다음 윈도우로 확장
 */

import { evaluateNamesWithLLM, applyLLMScore, shouldExcludeAsOldFashioned, EvaluationResult } from './llmEvaluator';

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
    usedHangul: Set<string>;
    usedCombinations: Set<string>;
    currentWindowStart: number;
    windowSize: number;
    phase: 'hangul' | 'hanja_alt';
    surname: string;
}

// ==========================================
// BatchManager Class
// ==========================================

export class BatchManager {
    private state: BatchManagerState;

    constructor(candidates: BatchNameCandidate[], surname: string) {
        const windowSize = candidates.length >= 150 ? 50 : 30;

        this.state = {
            candidates: this.sortByScore(candidates),
            usedHangul: new Set(),
            usedCombinations: new Set(),
            currentWindowStart: 0,
            windowSize,
            phase: 'hangul',
            surname
        };
    }

    /**
     * 다음 배치 가져오기 (5개)
     */
    async getNextBatch(batchSize: number = 5, useLLM: boolean = true): Promise<BatchResult> {
        const extractCount = batchSize + 3; // 8개 추출하여 5개 선별
        const extracted: BatchNameCandidate[] = [];

        // 8개가 될 때까지 추출
        while (extracted.length < extractCount && !this.isExhausted()) {
            const candidate = this.extractNextCandidate();
            if (candidate) {
                // 즉시 마킹하여 중복 추출 방지
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

        // LLM 검증
        let evaluated = extracted;
        if (useLLM) {
            try {
                evaluated = await this.evaluateWithLLM(extracted);
            } catch (error) {
                console.warn('[BatchManager] LLM failed, using score-based fallback');
                // Fallback: 점수 기반 정렬
                evaluated = extracted.sort((a, b) => b.score - a.score);
            }
        }

        // 상위 5개 선별 (이미 추출 시 마킹됨)
        const selected = evaluated.slice(0, batchSize);

        return {
            names: selected,
            hasMore: !this.isExhausted(),
            totalUsed: this.state.usedCombinations.size,
            isExhausted: this.isExhausted()
        };
    }

    /**
     * 고갈 여부 확인
     */
    isExhausted(): boolean {
        return this.state.currentWindowStart >= this.state.candidates.length;
    }

    /**
     * 현재 상태 가져오기 (저장용)
     */
    getState(): {
        usedHangul: string[];
        usedCombinations: string[];
        currentWindowStart: number;
        phase: string;
    } {
        return {
            usedHangul: Array.from(this.state.usedHangul),
            usedCombinations: Array.from(this.state.usedCombinations),
            currentWindowStart: this.state.currentWindowStart,
            phase: this.state.phase
        };
    }

    /**
     * 상태 복원 (이전 세션에서)
     */
    restoreState(savedState: {
        usedHangul: string[];
        usedCombinations: string[];
        currentWindowStart: number;
        phase: string;
    }): void {
        this.state.usedHangul = new Set(savedState.usedHangul);
        this.state.usedCombinations = new Set(savedState.usedCombinations);
        this.state.currentWindowStart = savedState.currentWindowStart;
        this.state.phase = savedState.phase as 'hangul' | 'hanja_alt';
    }

    // ==========================================
    // Private Methods
    // ==========================================

    private sortByScore(candidates: BatchNameCandidate[]): BatchNameCandidate[] {
        return [...candidates]
            .sort((a, b) => b.score - a.score)
            .map((c, i) => ({ ...c, rank: i + 1 }));
    }

    private getCurrentWindow(): BatchNameCandidate[] {
        const start = this.state.currentWindowStart;
        const end = Math.min(start + this.state.windowSize, this.state.candidates.length);
        return this.state.candidates.slice(start, end);
    }

    private extractNextCandidate(): BatchNameCandidate | null {
        const window = this.getCurrentWindow();

        if (window.length === 0) {
            return null;
        }

        if (this.state.phase === 'hangul') {
            // Phase 1: 새 한글 이름 찾기
            for (const candidate of window) {
                if (!this.state.usedHangul.has(candidate.hangulName) &&
                    !this.state.usedCombinations.has(this.getCombinationKey(candidate))) {
                    return candidate;
                }
            }
            // 현재 윈도우에서 새 한글 이름 없음 → 한자 대안 phase로
            this.state.phase = 'hanja_alt';
            return this.extractNextCandidate();
        } else {
            // Phase 2: 한자 대안 찾기 (same hangul, different hanja)
            for (const candidate of window) {
                const combKey = this.getCombinationKey(candidate);
                if (!this.state.usedCombinations.has(combKey)) {
                    return candidate;
                }
            }
            // 현재 윈도우 완전 소진 → 다음 윈도우로
            this.moveToNextWindow();
            return this.extractNextCandidate();
        }
    }

    private moveToNextWindow(): void {
        this.state.currentWindowStart += this.state.windowSize;
        this.state.phase = 'hangul';
    }

    private getCombinationKey(candidate: BatchNameCandidate): string {
        return `${candidate.hangulName}-${candidate.hanjaName}`;
    }

    private markAsUsed(candidate: BatchNameCandidate): void {
        this.state.usedHangul.add(candidate.hangulName);
        this.state.usedCombinations.add(this.getCombinationKey(candidate));
    }

    private async evaluateWithLLM(candidates: BatchNameCandidate[]): Promise<BatchNameCandidate[]> {
        const results = await evaluateNamesWithLLM(
            candidates.map(c => ({
                hangulName: c.hangulName,
                hanjaName: c.hanjaName,
                gender: c.gender
            })),
            this.state.surname
        );

        // LLM 결과 적용
        const evaluated = candidates.map(candidate => {
            const fullName = this.state.surname + candidate.hangulName;
            const llmResult = results.get(fullName);

            if (llmResult) {
                const adjustedScore = applyLLMScore(candidate.score, llmResult);
                const isExcluded = shouldExcludeAsOldFashioned(llmResult);

                return {
                    ...candidate,
                    score: adjustedScore,
                    llmScore: llmResult,
                    isExcludedAsOld: isExcluded
                };
            }
            return candidate;
        });

        // 제외된 이름 필터링 + 점수 정렬
        return evaluated
            .filter(c => !c.isExcludedAsOld)
            .sort((a, b) => b.score - a.score);
    }
}

// ==========================================
// Factory Function
// ==========================================

export function createBatchManager(candidates: BatchNameCandidate[], surname: string): BatchManager {
    return new BatchManager(candidates, surname);
}

export default BatchManager;
