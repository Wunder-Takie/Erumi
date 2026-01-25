/**
 * index.ts
 * 만세력 어댑터 통합 모듈
 */

import { fetchSajuFromKASI, isKASIAvailable, type SajuResult } from './kasiAdapter.ts';

// ==========================================
// Types
// ==========================================

type LocalCalculateSajuFn = (birthDate: Date | string, birthHour: number | null) => SajuResult;

interface ManselyeokStatus {
    apiAvailable: boolean;
    hasLocalFallback: boolean;
}

// ==========================================
// Internal State
// ==========================================

let localCalculateSaju: LocalCalculateSajuFn | null = null;

// ==========================================
// Exported Functions
// ==========================================

/**
 * 로컬 계산 함수 설정 (폴백용)
 */
export function setLocalFallback(calculateSajuFn: LocalCalculateSajuFn): void {
    localCalculateSaju = calculateSajuFn;
}

/**
 * 사주 계산 (API 우선, 폴백 지원)
 */
export async function getSaju(birthDate: Date | string, birthHour: number | null = null): Promise<SajuResult> {
    if (isKASIAvailable()) {
        try {
            const result = await fetchSajuFromKASI(birthDate, birthHour);
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.warn('[Manselyeok] API failed, falling back to local:', errorMessage);
        }
    }

    if (localCalculateSaju) {
        const result = localCalculateSaju(birthDate, birthHour);
        return { ...result, source: 'local_fallback' };
    }

    throw new Error('No saju calculation method available');
}

/**
 * API 상태 확인
 */
export function getManselyeokStatus(): ManselyeokStatus {
    return {
        apiAvailable: isKASIAvailable(),
        hasLocalFallback: !!localCalculateSaju
    };
}

// Re-exports
export { fetchSajuFromKASI, isKASIAvailable } from './kasiAdapter.ts';
export type { SajuResult, PillarInfo } from './kasiAdapter.ts';
