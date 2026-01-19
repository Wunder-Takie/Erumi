/**
 * sajuUtils.ts
 * 사주팔자 계산 유틸리티
 */

import sajuData from '../data/saju/saju_data.json' with { type: 'json' };
import { getSaju as getManselyeokSaju, isKASIAvailable } from './manselyeok/index.ts';

// ==========================================
// Types
// ==========================================

type ElementType = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';

interface SajuDataJson {
    '60갑자': string[];
    '천간': Record<string, { element: ElementType }>;
    '지지': Record<string, { element: ElementType }>;
    '월건표': Record<string, string[]>;
    '시건표': Record<string, string[]>;
}

interface HourInfo {
    start: number;
    end: number;
    branch: string;
    index: number;
}

export interface PillarResult {
    pillar: string;
    stem: string;
    branch: string;
    stemElement: ElementType;
    branchElement: ElementType;
    solarMonth?: number;
    hourInfo?: HourInfo;
}

export interface SajuResult {
    year: PillarResult | null;
    month: PillarResult | null;
    day: PillarResult | null;
    hour: PillarResult | null;
    source: 'kasi_api' | 'local_calculation' | 'local_fallback';
    birthInfo: {
        year: number;
        month: number;
        day: number;
        hour: number | null;
    };
}

interface ElementDistribution {
    Wood: number;
    Fire: number;
    Earth: number;
    Metal: number;
    Water: number;
}

export interface ElementAnalysis {
    distribution: ElementDistribution;
    needed: string[];
    excess: string[];
    total: number;
}

interface StrengthAnalysis {
    dayElement: ElementType;
    monthElement: ElementType;
    seasonScore: number;
    sameElementCount: number;
    birthingCount: number;
    totalStrength: number;
    isStrong: boolean;
}

export interface YongsinResult {
    strength: StrengthAnalysis;
    yongsin: string[];
    huisin: string[];
    gisin: string[];
    missing: string[];
    summary: string;
}

// ==========================================
// Internal State
// ==========================================

const typedSajuData = sajuData as SajuDataJson;

const ELEMENT_GENERATION: Record<ElementType, ElementType> = {
    Wood: 'Fire',
    Fire: 'Earth',
    Earth: 'Metal',
    Metal: 'Water',
    Water: 'Wood'
};

const ELEMENT_DESTRUCTION: Record<ElementType, ElementType> = {
    Wood: 'Earth',
    Fire: 'Metal',
    Earth: 'Water',
    Metal: 'Wood',
    Water: 'Fire'
};

// ==========================================
// Internal Functions
// ==========================================

function getSolarMonth(month: number, day: number): number {
    const boundaries = [
        { month: 1, day: 5 },
        { month: 2, day: 4 },
        { month: 3, day: 6 },
        { month: 4, day: 5 },
        { month: 5, day: 6 },
        { month: 6, day: 6 },
        { month: 7, day: 7 },
        { month: 8, day: 8 },
        { month: 9, day: 8 },
        { month: 10, day: 8 },
        { month: 11, day: 7 },
        { month: 12, day: 7 }
    ];

    const boundary = boundaries[month - 1];
    if (day >= boundary.day) {
        return month;
    } else {
        return month === 1 ? 12 : month - 1;
    }
}

function getHourBranch(hour: number): HourInfo {
    const hourMap: HourInfo[] = [
        { start: 23, end: 1, branch: '자', index: 0 },
        { start: 1, end: 3, branch: '축', index: 1 },
        { start: 3, end: 5, branch: '인', index: 2 },
        { start: 5, end: 7, branch: '묘', index: 3 },
        { start: 7, end: 9, branch: '진', index: 4 },
        { start: 9, end: 11, branch: '사', index: 5 },
        { start: 11, end: 13, branch: '오', index: 6 },
        { start: 13, end: 15, branch: '미', index: 7 },
        { start: 15, end: 17, branch: '신', index: 8 },
        { start: 17, end: 19, branch: '유', index: 9 },
        { start: 19, end: 21, branch: '술', index: 10 },
        { start: 21, end: 23, branch: '해', index: 11 }
    ];

    for (const h of hourMap) {
        if (h.start <= h.end) {
            if (hour >= h.start && hour < h.end) return h;
        } else {
            if (hour >= h.start || hour < h.end) return h;
        }
    }
    return hourMap[0];
}

function analyzeDayMasterStrength(saju: SajuResult | null): StrengthAnalysis {
    if (!saju || !saju.day || !saju.month) {
        console.warn('[analyzeDayMasterStrength] Missing required pillars');
        return {
            dayElement: 'Wood',
            monthElement: 'Wood',
            seasonScore: 0,
            sameElementCount: 0,
            birthingCount: 0,
            totalStrength: 0,
            isStrong: false
        };
    }

    if (!saju.day.stemElement || !saju.month.branchElement) {
        console.warn('[analyzeDayMasterStrength] Pillars missing element info');
        return {
            dayElement: saju.day.stemElement || 'Wood',
            monthElement: saju.month.branchElement || 'Wood',
            seasonScore: 0,
            sameElementCount: 0,
            birthingCount: 0,
            totalStrength: 0,
            isStrong: false
        };
    }

    const dayElement = saju.day.stemElement;
    const monthElement = saju.month.branchElement;
    const distribution = analyzeElements(saju).distribution;

    let seasonScore = 0;
    if (monthElement === dayElement) {
        seasonScore = 2;
    } else if (ELEMENT_GENERATION[monthElement] === dayElement) {
        seasonScore = 1;
    } else if (ELEMENT_GENERATION[dayElement] === monthElement) {
        seasonScore = 0;
    } else if (ELEMENT_DESTRUCTION[monthElement] === dayElement) {
        seasonScore = -1;
    } else if (ELEMENT_DESTRUCTION[dayElement] === monthElement) {
        seasonScore = -2;
    }

    const sameElementCount = distribution[dayElement] || 0;
    const birthingElement = (Object.keys(ELEMENT_GENERATION) as ElementType[]).find(
        k => ELEMENT_GENERATION[k] === dayElement
    );
    const birthingCount = birthingElement ? distribution[birthingElement] || 0 : 0;

    const totalStrength = (sameElementCount * 1.5) + (birthingCount * 1) + seasonScore;
    const isStrong = totalStrength >= 4;

    return {
        dayElement,
        monthElement,
        seasonScore,
        sameElementCount,
        birthingCount,
        totalStrength,
        isStrong
    };
}

function generateYongsinSummary(strength: StrengthAnalysis, yongsin: string[]): string {
    const elementNames: Record<string, string> = {
        Wood: '목(木)',
        Fire: '화(火)',
        Earth: '토(土)',
        Metal: '금(金)',
        Water: '수(水)'
    };

    const dayName = elementNames[strength.dayElement] || strength.dayElement;
    const strengthText = strength.isStrong ? '강한' : '약한';
    const yongsinNames = yongsin.map(e => elementNames[e]).join(', ');

    return `일간 ${dayName}이 ${strengthText} 편입니다. 용신은 ${yongsinNames}입니다.`;
}

// ==========================================
// Exported Functions
// ==========================================

export function getYearPillar(year: number): PillarResult {
    const baseYear = 1984;
    const diff = year - baseYear;

    let index = diff % 60;
    if (index < 0) index += 60;

    const pillar = typedSajuData['60갑자'][index];
    const stem = pillar[0];
    const branch = pillar[1];

    return {
        pillar,
        stem,
        branch,
        stemElement: typedSajuData['천간'][stem].element,
        branchElement: typedSajuData['지지'][branch].element
    };
}

export function getMonthPillar(year: number, month: number, day: number): PillarResult {
    const yearPillar = getYearPillar(year);
    const solarMonth = getSolarMonth(month, day);

    const yearStem = yearPillar.stem;
    const monthPillars = typedSajuData['월건표'][yearStem];

    const pillar = monthPillars[solarMonth - 1];
    const stem = pillar[0];
    const branch = pillar[1];

    return {
        pillar,
        stem,
        branch,
        stemElement: typedSajuData['천간'][stem].element,
        branchElement: typedSajuData['지지'][branch].element,
        solarMonth
    };
}

export function getDayPillar(year: number, month: number, day: number): PillarResult {
    const baseDate = new Date(2000, 0, 1);
    const targetDate = new Date(year, month - 1, day);

    const diffDays = Math.floor((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));

    let index = (40 + diffDays) % 60;
    if (index < 0) index += 60;

    const pillar = typedSajuData['60갑자'][index];
    const stem = pillar[0];
    const branch = pillar[1];

    return {
        pillar,
        stem,
        branch,
        stemElement: typedSajuData['천간'][stem].element,
        branchElement: typedSajuData['지지'][branch].element
    };
}

export function getHourPillar(dayStem: string, hour: number): PillarResult {
    const hourInfo = getHourBranch(hour);
    const hourPillars = typedSajuData['시건표'][dayStem];

    const pillar = hourPillars[hourInfo.index];
    const stem = pillar[0];
    const branch = pillar[1];

    return {
        pillar,
        stem,
        branch,
        stemElement: typedSajuData['천간'][stem].element,
        branchElement: typedSajuData['지지'][branch].element,
        hourInfo
    };
}

export async function calculateSaju(birthDate: Date | string, birthHour: number | null = null): Promise<SajuResult> {
    const useKASI = true;

    if (useKASI && isKASIAvailable()) {
        try {
            console.log('[Saju] Using KASI API for precise calculation');
            const result = await getManselyeokSaju(birthDate, birthHour);
            return result as SajuResult;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.warn('[Saju] KASI API failed, using local fallback:', errorMessage);
        }
    }

    console.log('[Saju] Using local calculation');
    const date = new Date(birthDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const yearPillar = getYearPillar(year);
    const monthPillar = getMonthPillar(year, month, day);
    const dayPillar = getDayPillar(year, month, day);

    let hourPillar: PillarResult | null = null;
    if (birthHour !== null) {
        hourPillar = getHourPillar(dayPillar.stem, birthHour);
    }

    return {
        year: yearPillar,
        month: monthPillar,
        day: dayPillar,
        hour: hourPillar,
        source: 'local_calculation',
        birthInfo: { year, month, day, hour: birthHour }
    };
}

export function analyzeElements(saju: SajuResult | null): ElementAnalysis {
    if (!saju) {
        console.error('[analyzeElements] saju is null or undefined');
        return { distribution: { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 }, needed: [], excess: [], total: 0 };
    }

    const counts: ElementDistribution = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };

    const pillars = [saju.year, saju.month, saju.day];
    if (saju.hour) pillars.push(saju.hour);

    for (const pillar of pillars) {
        if (!pillar) {
            console.warn('[analyzeElements] Skipping null pillar');
            continue;
        }
        if (!pillar.stemElement || !pillar.branchElement) {
            console.warn('[analyzeElements] Pillar missing elements:', pillar);
        }
        if (pillar.stemElement) counts[pillar.stemElement]++;
        if (pillar.branchElement) counts[pillar.branchElement]++;
    }

    const needed = Object.entries(counts)
        .filter(([, count]) => count <= 1)
        .sort((a, b) => a[1] - b[1])
        .map(([element]) => element);

    const excess = Object.entries(counts)
        .filter(([, count]) => count >= 3)
        .sort((a, b) => b[1] - a[1])
        .map(([element]) => element);

    return {
        distribution: counts,
        needed,
        excess,
        total: Object.values(counts).reduce((a, b) => a + b, 0)
    };
}

export function sajuToWeights(saju: SajuResult | null): Record<ElementType, number> {
    const analysis = analyzeElements(saju);
    const weights: Record<ElementType, number> = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };

    analysis.needed.forEach((element, index) => {
        weights[element as ElementType] = 30 - (index * 10);
    });

    return weights;
}

export function generateAnalysisText(saju: SajuResult | null): string {
    const analysis = analyzeElements(saju);

    const elementNames: Record<string, string> = {
        Wood: '나무(木)',
        Fire: '불(火)',
        Earth: '흙(土)',
        Metal: '쇠(金)',
        Water: '물(水)'
    };

    let text = '';

    if (analysis.needed.length > 0) {
        const neededNames = analysis.needed.map(e => elementNames[e]).join(', ');
        text += `${neededNames}의 기운이 부족합니다. `;
        text += `이름에서 이 기운을 보충해주면 좋습니다.`;
    } else {
        text += '오행이 비교적 균형 잡혀 있습니다.';
    }

    return text;
}

export function extractYongsin(saju: SajuResult | null): YongsinResult {
    const strength = analyzeDayMasterStrength(saju);
    const dayElement = strength.dayElement;
    const distribution = analyzeElements(saju).distribution;

    const relationships = {
        same: dayElement,
        birther: (Object.keys(ELEMENT_GENERATION) as ElementType[]).find(k => ELEMENT_GENERATION[k] === dayElement),
        child: ELEMENT_GENERATION[dayElement],
        controller: (Object.keys(ELEMENT_GENERATION) as ElementType[]).find(k => ELEMENT_DESTRUCTION[k] === dayElement),
        controlled: ELEMENT_DESTRUCTION[dayElement]
    };

    let yongsin: string[] = [];
    let huisin: string[] = [];
    let gisin: string[] = [];

    if (strength.isStrong) {
        if (relationships.child) yongsin.push(relationships.child);
        if (relationships.controller) huisin.push(relationships.controller);
        if (relationships.controlled) huisin.push(relationships.controlled);
        gisin.push(relationships.same);
        if (relationships.birther) gisin.push(relationships.birther);
    } else {
        if (relationships.birther) yongsin.push(relationships.birther);
        huisin.push(relationships.same);
        if (relationships.child) gisin.push(relationships.child);
        if (relationships.controller) gisin.push(relationships.controller);
    }

    yongsin = yongsin.filter(Boolean);
    huisin = huisin.filter(Boolean);
    gisin = gisin.filter(Boolean);

    const missingElements = (Object.keys(distribution) as ElementType[]).filter(e => distribution[e] === 0);

    return {
        strength,
        yongsin,
        huisin,
        gisin,
        missing: missingElements,
        summary: generateYongsinSummary(strength, yongsin)
    };
}

export default {
    calculateSaju,
    analyzeElements,
    sajuToWeights,
    generateAnalysisText,
    extractYongsin,
    getYearPillar,
    getMonthPillar,
    getDayPillar,
    getHourPillar
};
