/**
 * namingService.ts
 * 이름 생성 서비스 - 엔진 호출 + 배치 관리 + 리포트 생성
 */

import { generateNames, BatchManager, createBatchManager, BatchNameCandidate, generateReport, NameReport, ReportInput } from 'erumi-core';
import { mapWizardDataToEngineParams, WizardData, EngineParams } from './wizardDataMapper';

// ==========================================
// Types
// ==========================================

export interface NamingSession {
    engineParams: EngineParams;
    allCandidates: BatchNameCandidate[];
    batchManager: BatchManager;
    isInitialized: boolean;
    wizardData: WizardData;  // 리포트 생성용
}

export interface BatchResult {
    names: BatchNameCandidate[];
    hasMore: boolean;
    totalUsed: number;
    isExhausted: boolean;
}

// 리포트 캐시 (한자이름 키로 저장)
const reportCache = new Map<string, NameReport>();

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

        // 엔진 호출 (positional args: surname, surnameHanja, tags, gender, preferenceWeights, yongsinWeights, styleMode)
        const rawCandidates = await generateNames(
            engineParams.surnameInput.hangul,    // surnameInput
            engineParams.surnameInput.hanja || null,  // 🆕 surnameHanja (사용자 선택 한자)
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
            wizardData,  // 리포트 생성용 저장
        };

        return candidates;
    }

    /**
     * 배치에 대한 리포트 미리 생성 (병렬)
     */
    private async preloadReports(names: BatchNameCandidate[]): Promise<void> {
        if (!this.session) return;

        const { wizardData, engineParams } = this.session;

        // 병렬로 리포트 생성
        await Promise.all(names.map(async (name) => {
            const cacheKey = name.hanjaName;

            // 이미 캐시에 있으면 스킵
            if (reportCache.has(cacheKey)) return;

            try {
                const input: ReportInput = {
                    surname: engineParams.surnameInput.hangul,
                    surnameHanja: engineParams.surnameInput.hanja,
                    givenName: [name.hanja1?.hangul || '', name.hanja2?.hangul || ''],
                    givenNameHanja: [name.hanja1?.hanja || '', name.hanja2?.hanja || ''],
                    saju: wizardData.birthDate ? {
                        birthDate: wizardData.birthDate.toISOString().split('T')[0],
                        birthHour: wizardData.birthTime ? parseInt(wizardData.birthTime) : null,
                        elements: engineParams.sajuElements,  // 퍼센트 (UI용)
                        elementCounts: engineParams.sajuElementCounts,  // 개수 (LLM용)
                        yongsin: engineParams.yongsin,        // 용신 오행 배열
                    } : undefined,
                };

                const report = await generateReport(input);
                reportCache.set(cacheKey, report);
                console.log(`[NamingService] Report generated for: ${cacheKey}`);
            } catch (error) {
                console.error(`[NamingService] Report generation failed for ${cacheKey}:`, error);
            }
        }));
    }

    /**
     * 첫 번째 배치 가져오기 + 리포트 미리 생성
     * @param count 가져올 개수 (무료=1, 이미 사용=5)
     */
    async getFirstBatch(count: number = 1): Promise<BatchResult> {
        if (!this.session?.isInitialized) {
            throw new Error('NamingService not initialized');
        }

        // 🆕 무료체험(count=1)일 때: 상위 50개 중 랜덤으로 1개 선택
        if (count === 1) {
            // 50개를 먼저 가져옴
            const result = await this.session.batchManager.getNextBatch(50, true);

            if (result.names.length === 0) {
                return result;
            }

            // 랜덤으로 1개 선택
            const randomIndex = Math.floor(Math.random() * Math.min(50, result.names.length));
            const selectedName = result.names[randomIndex];

            console.log(`[NamingService] 무료체험: ${result.names.length}개 중 ${randomIndex + 1}번째 선택`);

            // 리포트 미리 생성 (선택된 1개만)
            await this.preloadReports([selectedName]);

            return {
                names: [selectedName],
                hasMore: result.hasMore,
                totalUsed: result.totalUsed,
                isExhausted: result.isExhausted
            };
        }

        // 기존 로직 (5개 요청 시)
        const result = await this.session.batchManager.getNextBatch(count, true);

        // 리포트 미리 생성
        await this.preloadReports(result.names);

        return result;
    }

    /**
     * 다음 배치 가져오기 (5개) + 리포트 미리 생성
     */
    async getNextBatch(): Promise<BatchResult> {
        if (!this.session?.isInitialized) {
            throw new Error('NamingService not initialized');
        }

        const result = await this.session.batchManager.getNextBatch(5, true);

        // 리포트 미리 생성
        await this.preloadReports(result.names);

        return result;
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
        currentTierStart: number;
        phase: string;
        currentSearchIndex: number;
    } | null {
        return this.session?.batchManager.getState() ?? null;
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
        if (this.session?.batchManager) {
            this.session.batchManager.restoreState(savedState);
        }
    }

    /**
     * 캐시에서 리포트 가져오기
     */
    getReport(hanjaName: string): NameReport | undefined {
        return reportCache.get(hanjaName);
    }

    /**
     * 사주 오행 가져오기 (이미 계산된 값)
     */
    getSajuElements(): Record<string, number> | undefined {
        return this.session?.engineParams.sajuElements;
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
        reportCache.clear();  // 리포트 캐시도 초기화
    }
}

// 싱글톤 인스턴스
export const namingService = new NamingService();

export default namingService;
