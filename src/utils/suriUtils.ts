/**
 * suriUtils.ts
 * 수리(81 획수) 관련 유틸리티
 */

import suri81 from '../data/saju/suri_81.json' with { type: 'json' };
import surnames from '../data/core/surnames.json' with { type: 'json' };

// ============================================
// Types
// ============================================

export interface Suri81Entry {
    count: number;
    level: string;
    desc: string;
}

export interface SurnameInfo {
    hangul: string;
    hanja: string;
    strokes: number;
    element: string;
}

export interface SuriSection {
    count: number;
    info: {
        level: string;
        name?: string;
        description?: string;
    };
}

export interface SuriInfo {
    초년운?: SuriSection;
    중년운?: SuriSection;
    말년운?: SuriSection;
    총운?: SuriSection;
}

// ============================================
// Functions
// ============================================

/**
 * 81수리 리스트에서 해당 숫자가 길(Lucky)인지 확인
 * @param count - 획수 합계
 * @returns 길하면 true
 */
export function isLuckySuri(count: number): boolean {
    const normalizedCount = count > 81 ? (count % 81 || 81) : count;
    return (suri81 as Suri81Entry[]).some(s => s.count === normalizedCount);
}

/**
 * 81수리 정보 가져오기
 * @param count - 획수 합계
 * @returns 수리 정보 또는 null
 */
export function getSuriInfo(count: number): Suri81Entry | null {
    const normalizedCount = count > 81 ? (count % 81 || 81) : count;
    return (suri81 as Suri81Entry[]).find(s => s.count === normalizedCount) || null;
}

/**
 * 성씨 정보 가져오기
 * @param hangul - 성씨 한글
 * @returns 성씨 정보 또는 null
 */
export function getSurnameInfo(hangul: string): SurnameInfo | null {
    return (surnames as SurnameInfo[]).find(s => s.hangul === hangul) || null;
}

/**
 * Fair Suri 점수 계산 (공정성 개선, 우수성 보상)
 * 기본 15점 보장, 최대 50점
 */
export function calculateWeightedSuriScore(suriInfo: SuriInfo): number {
    // 1단계: 기본 보장 (15점)
    let score = 15;

    // 2단계: 중요 운세 평가
    const 중년운Level = suriInfo.중년운?.info?.level;
    const 총운Level = suriInfo.총운?.info?.level;
    const 말년운Level = suriInfo.말년운?.info?.level;
    const 초년운Level = suriInfo.초년운?.info?.level;

    // 중년운 (사회생활) - 보너스/페널티
    if (중년운Level === '대길') score += 10;
    else if (중년운Level === '길') score += 5;
    else if (중년운Level === '반길반흉') score -= 2;
    else if (중년운Level === '흉') score -= 5;

    // 총운 (전체 운세) - 보너스/페널티
    if (총운Level === '대길') score += 12;
    else if (총운Level === '길') score += 6;
    else if (총운Level === '반길반흉') score -= 3;
    else if (총운Level === '흉') score -= 6;

    // 3단계: 보조 운세 보너스/페널티
    // 초년운
    if (초년운Level === '대길') score += 4;
    else if (초년운Level === '흉') score -= 2;

    // 말년운 (노후 안정 중요!) - 강화된 보너스/페널티
    if (말년운Level === '대길') score += 6;
    else if (말년운Level === '길') score += 2;
    else if (말년운Level === '반길반흉') score -= 4;
    else if (말년운Level === '흉') score -= 8;

    // 4단계: 4대길 완벽 조합 보너스
    const levels = [초년운Level, 중년운Level, 말년운Level, 총운Level];
    const all대길 = levels.every(level => level === '대길');
    if (all대길) score += 3;

    // 최소 5점, 최대 50점
    return Math.max(5, Math.min(50, score));
}

/**
 * 수리 품질 분석 (타이브레이커용)
 */
export function analyzeSuriQuality(suri: SuriInfo): {
    total대길: number;
    has흉: boolean;
    total길이상: number;
} {
    const levels = [
        suri.초년운?.info?.level,
        suri.중년운?.info?.level,
        suri.말년운?.info?.level,
        suri.총운?.info?.level
    ];

    return {
        total대길: levels.filter(l => l === '대길').length,
        has흉: levels.some(l => l === '흉'),
        total길이상: levels.filter(l => l === '대길' || l === '길').length
    };
}

/**
 * 수리 티어 계산 (점수 정규화용)
 */
export function getSuriTier(suri: SuriInfo): number {
    const { total대길, has흉, total길이상 } = analyzeSuriQuality(suri);

    if (total대길 >= 3) return 1.15;      // S티어: 대길 3개 이상
    if (total대길 >= 2) return 1.10;      // A티어: 대길 2개
    if (total길이상 >= 3) return 1.05;    // B티어: 길 이상 3개
    if (has흉) return 0.90;               // D티어: 흉 있음
    return 1.0;                            // C티어: 보통
}
