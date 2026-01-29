/**
 * namingService.ts
 * 이름 생성 서비스 - 엔진 호출 + 배치 관리
 */

import { generateNames, BatchManager, createBatchManager, BatchNameCandidate } from 'erumi-core';
import { mapWizardDataToEngineParams, WizardData, EngineParams } from './wizardDataMapper';

// ==========================================
// Types
// ==========================================

export interface NamingSession {
    engineParams: EngineParams;
    allCandidates: BatchNameCandidate[];
    batchManager: BatchManager;
    isInitialized: boolean;
}

export interface BatchResult {
    names: BatchNameCandidate[];
    hasMore: boolean;
    totalUsed: number;
    isExhausted: boolean;
}

// ==========================================
// Naming Service Class
// ==========================================

export class NamingService {
    private session: NamingSession | null = null;

    /**
     * 세션 초기화 - WizardData로 이름 생성
     */
    async initialize(wizardData: WizardData): Promise<BatchNameCandidate[]> {
        // WizardData → EngineParams 변환
        const engineParams = await mapWizardDataToEngineParams(wizardData);

        // 엔진 호출 (positional args: surname, tags, gender, preferenceWeights, yongsinWeights, styleMode)
        const rawCandidates = await generateNames(
            engineParams.surnameInput.hangul,    // surnameInput
            [],                                   // selectedTagIds (미사용)
            engineParams.gender,                  // gender
            engineParams.preferenceWeights,       // preferenceWeights
            engineParams.yongsinWeights,          // yongsinWeights
            engineParams.styleMode                // styleMode
        );

        // 후보를 BatchNameCandidate 형식으로 변환
        const candidates: BatchNameCandidate[] = rawCandidates.map((c: any, i: number) => ({
            hangulName: c.hangulName || (c.hangul1 + c.hangul2),
            hanjaName: c.hanjaName || (c.hanja1 + c.hanja2),
            hanja1: c.hanja1,
            hanja2: c.hanja2,
            score: c.score,
            rank: i + 1,
            gender: engineParams.gender || 'N',
        }));

        // BatchManager 생성
        const batchManager = createBatchManager(
            candidates,
            engineParams.surnameInput.hangul
        );

        // 세션 저장
        this.session = {
            engineParams,
            allCandidates: candidates,
            batchManager,
            isInitialized: true,
        };

        return candidates;
    }

    /**
     * 첫 번째 배치 가져오기 (무료 1개)
     */
    async getFirstBatch(): Promise<BatchResult> {
        if (!this.session?.isInitialized) {
            throw new Error('NamingService not initialized');
        }

        return this.session.batchManager.getNextBatch(1, true);
    }

    /**
     * 다음 배치 가져오기 (5개)
     */
    async getNextBatch(): Promise<BatchResult> {
        if (!this.session?.isInitialized) {
            throw new Error('NamingService not initialized');
        }

        return this.session.batchManager.getNextBatch(5, true);
    }

    /**
     * 고갈 여부 확인
     */
    isExhausted(): boolean {
        return this.session?.batchManager.isExhausted() ?? true;
    }

    /**
     * 현재 상태 가져오기 (저장용)
     */
    getState(): {
        usedHangul: string[];
        usedCombinations: string[];
        currentWindowStart: number;
        phase: string;
    } | null {
        return this.session?.batchManager.getState() ?? null;
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
        if (this.session?.batchManager) {
            this.session.batchManager.restoreState(savedState);
        }
    }

    /**
     * 총 후보 수
     */
    getTotalCandidates(): number {
        return this.session?.allCandidates.length ?? 0;
    }

    /**
     * 세션 초기화
     */
    reset(): void {
        this.session = null;
    }
}

// 싱글톤 인스턴스
export const namingService = new NamingService();

export default namingService;
