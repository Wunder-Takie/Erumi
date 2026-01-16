/**
 * index.js
 * 만세력 어댑터 통합 모듈
 */

import { fetchSajuFromKASI, isKASIAvailable } from './kasiAdapter.js';

// 로컬 폴백용 (기존 sajuUtils에서 가져옴)
let localCalculateSaju = null;

/**
 * 로컬 계산 함수 설정 (폴백용)
 */
export function setLocalFallback(calculateSajuFn) {
    localCalculateSaju = calculateSajuFn;
}

/**
 * 사주 계산 (API 우선, 폴백 지원)
 * @param {Date|string} birthDate - 생년월일
 * @param {number|null} birthHour - 태어난 시간
 * @returns {Promise<Object>}
 */
export async function getSaju(birthDate, birthHour = null) {
    // API 사용 가능하면 API 우선
    if (isKASIAvailable()) {
        try {
            const result = await fetchSajuFromKASI(birthDate, birthHour);
            return result;
        } catch (error) {
            console.warn('[Manselyeok] API failed, falling back to local:', error.message);
        }
    }

    // 폴백: 로컬 계산
    if (localCalculateSaju) {
        const result = localCalculateSaju(birthDate, birthHour);
        return { ...result, source: 'local_fallback' };
    }

    throw new Error('No saju calculation method available');
}

/**
 * API 상태 확인
 */
export function getManselyeokStatus() {
    return {
        apiAvailable: isKASIAvailable(),
        hasLocalFallback: !!localCalculateSaju
    };
}

export { fetchSajuFromKASI, isKASIAvailable } from './kasiAdapter.js';
