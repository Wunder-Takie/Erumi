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
    private globalSaju: { birthDate: Date; birthTime?: string; elements?: Record<string, number>; elementCounts?: Record<string, number>; yongsin?: string[] } | null = null;

    /**
     * 세션 초기화 - WizardData로 이름 생성
     */
    async initialize(wizardData: WizardData): Promise<BatchNameCandidate[]> {
        // 🆕 새 세션 시작 - 이전 globalSaju 초기화 (사주 스킵 시 이전 세션 사주 적용 방지)
        this.globalSaju = null;

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
     * 전역 사주 정보가 있으면 우선 사용
     */
    private async preloadReports(names: BatchNameCandidate[]): Promise<void> {
        if (!this.session) return;

        const { wizardData, engineParams } = this.session;

        // 전역 사주 정보 우선, 없으면 wizardData 사용
        const effectiveBirthDate = this.globalSaju?.birthDate || wizardData.birthDate;
        const effectiveElements = this.globalSaju?.elements || engineParams.sajuElements;
        const effectiveElementCounts = this.globalSaju?.elementCounts || engineParams.sajuElementCounts;
        const effectiveYongsin = this.globalSaju?.yongsin || engineParams.yongsin;

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
                    saju: effectiveBirthDate ? {
                        birthDate: effectiveBirthDate.toISOString().split('T')[0],
                        birthHour: this.globalSaju?.birthTime
                            ? this.getHourFromZodiacTime(this.globalSaju.birthTime)
                            : (wizardData.birthTime ? parseInt(wizardData.birthTime) : null),
                        elements: effectiveElements,
                        elementCounts: effectiveElementCounts,
                        yongsin: effectiveYongsin,
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
     * 새 사주 정보로 리포트 재생성
     * @param hanjaName 한자 이름 (캐시 키)
     * @param newSaju 새로운 사주 정보
     * @returns 재생성된 리포트
     */
    async regenerateReportWithSaju(
        hanjaName: string,
        newSaju: { birthDate: Date; birthTime?: string }
    ): Promise<NameReport> {
        if (!this.session) {
            throw new Error('NamingService session not found');
        }

        const { engineParams } = this.session;

        // 해당 이름의 후보 찾기
        const candidate = this.session.allCandidates.find(c => c.hanjaName === hanjaName);
        if (!candidate) {
            throw new Error(`Candidate not found for: ${hanjaName}`);
        }

        // 기존 캐시 삭제
        reportCache.delete(hanjaName);

        // 새 사주 정보로 오행 재계산
        const birthHour = newSaju.birthTime ? this.getHourFromZodiacTime(newSaju.birthTime) : null;

        let sajuElements: Record<string, number> | undefined = undefined;
        let sajuElementCounts: Record<string, number> | undefined = undefined;
        let yongsin: string[] | undefined = undefined;

        try {
            // erumi-core의 calculateSaju로 새 사주 계산
            const { calculateSaju, extractYongsin } = await import('erumi-core');
            const saju = await calculateSaju(newSaju.birthDate, birthHour);
            const yongsinResult = extractYongsin(saju);

            // 오행 개수 계산
            const pillars = [saju.year, saju.month, saju.day, saju.hour].filter(Boolean);
            const counts: Record<string, number> = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };
            for (const pillar of pillars) {
                if (pillar?.stemElement) counts[pillar.stemElement]++;
                if (pillar?.branchElement) counts[pillar.branchElement]++;
            }
            const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;

            // 원본 개수 저장 (LLM용)
            sajuElementCounts = { ...counts };

            // 퍼센트로 변환 (UI 그래프용)
            sajuElements = {
                Wood: Math.round((counts.Wood / total) * 100),
                Fire: Math.round((counts.Fire / total) * 100),
                Earth: Math.round((counts.Earth / total) * 100),
                Metal: Math.round((counts.Metal / total) * 100),
                Water: Math.round((counts.Water / total) * 100),
            };

            yongsin = yongsinResult.yongsin;

            // 전역 사주 정보 저장 (이후 preloadReports에서 사용)
            this.globalSaju = {
                birthDate: newSaju.birthDate,
                birthTime: newSaju.birthTime,
                elements: sajuElements,
                elementCounts: sajuElementCounts,
                yongsin: yongsin,
            };

            console.log('[NamingService] Recalculated saju elements:', sajuElements);
            console.log('[NamingService] Recalculated yongsin:', yongsin);
            console.log('[NamingService] Global saju saved for future batches');
        } catch (error) {
            console.warn('[NamingService] Saju recalculation failed, using default values:', error);
            // 실패 시에도 사주 정보는 있으므로 기본값 사용 (hasSaju=true 보장)
            sajuElements = engineParams.sajuElements ?? {
                Wood: 20, Fire: 20, Earth: 20, Metal: 20, Water: 20,
            };
            sajuElementCounts = engineParams.sajuElementCounts ?? {
                Wood: 1, Fire: 1, Earth: 1, Metal: 1, Water: 1,
            };
            yongsin = engineParams.yongsin ?? [];

            // 🔧 실패해도 globalSaju 저장 (새 배치 로드 시 사주 정보 유지)
            this.globalSaju = {
                birthDate: newSaju.birthDate,
                birthTime: newSaju.birthTime,
                elements: sajuElements,
                elementCounts: sajuElementCounts,
                yongsin: yongsin,
            };
            console.log('[NamingService] Global saju saved with fallback values');
        }

        const input: ReportInput = {
            surname: engineParams.surnameInput.hangul,
            surnameHanja: engineParams.surnameInput.hanja,
            givenName: [candidate.hanja1?.hangul || '', candidate.hanja2?.hangul || ''],
            givenNameHanja: [candidate.hanja1?.hanja || '', candidate.hanja2?.hanja || ''],
            saju: {
                birthDate: newSaju.birthDate.toISOString().split('T')[0],
                birthHour,
                elements: sajuElements,
                elementCounts: sajuElementCounts,
                yongsin: yongsin,
            },
        };

        console.log('[NamingService] Regenerating report with new saju for:', hanjaName);

        const report = await generateReport(input);
        reportCache.set(hanjaName, report);

        return report;
    }

    /**
     * 새 사주 정보로 캐시된 모든 리포트 병렬 재생성
     * @param newSaju 새로운 사주 정보
     * @returns 재생성된 리포트 개수
     */
    async regenerateAllReportsWithSaju(
        newSaju: { birthDate: Date; birthTime?: string }
    ): Promise<number> {
        if (!this.session) {
            throw new Error('NamingService session not found');
        }

        // 캐시된 모든 리포트 키 가져오기
        const cachedKeys = Array.from(reportCache.keys());
        if (cachedKeys.length === 0) {
            console.log('[NamingService] No cached reports to regenerate');
            return 0;
        }

        console.log(`[NamingService] Regenerating ${cachedKeys.length} reports with new saju...`);

        // 병렬로 모든 리포트 재생성
        const results = await Promise.allSettled(
            cachedKeys.map(hanjaName => this.regenerateReportWithSaju(hanjaName, newSaju))
        );

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failCount = results.filter(r => r.status === 'rejected').length;

        console.log(`[NamingService] Regeneration complete: ${successCount} success, ${failCount} failed`);

        return successCount;
    }

    /**
     * 시진(zodiac time) ID를 시간(hour)으로 변환
     */
    private getHourFromZodiacTime(zodiacId: string): number | null {
        const zodiacToHour: Record<string, number> = {
            'ja': 0,      // 자시 23:00~01:00
            'chuk': 2,    // 축시 01:00~03:00
            'in': 4,      // 인시 03:00~05:00
            'myo': 6,     // 묘시 05:00~07:00
            'jin': 8,     // 진시 07:00~09:00
            'sa': 10,     // 사시 09:00~11:00
            'o': 12,      // 오시 11:00~13:00
            'mi': 14,     // 미시 13:00~15:00
            'sin': 16,    // 신시 15:00~17:00
            'yu': 18,     // 유시 17:00~19:00
            'sul': 20,    // 술시 19:00~21:00
            'hae': 22,    // 해시 21:00~23:00
        };
        return zodiacToHour[zodiacId] ?? null;
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
        this.globalSaju = null;  // 전역 사주 정보도 초기화
        reportCache.clear();  // 리포트 캐시도 초기화
    }
}

// 싱글톤 인스턴스
export const namingService = new NamingService();

export default namingService;
