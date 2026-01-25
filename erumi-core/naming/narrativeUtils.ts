/**
 * narrativeUtils.ts
 * 내러티브 생성 유틸리티 - 사주, 수리, 균형 스토리 생성
 */

import sajuNarratives from '../data/saju/saju_narratives.json' with { type: 'json' };

// ==========================================
// Types
// ==========================================

type ElementType = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';
type BalanceLevel = 'excellent' | 'good' | 'fair' | 'needsWork';
type ElementStatus = 'high' | 'low';
type StageType = '초년운' | '중년운' | '말년운' | '총운';

export interface PillarInfo {
    stem?: string;
    branch?: string;
    reading?: string;
    element?: ElementType;
}

export interface SajuData {
    year?: PillarInfo;
    month?: PillarInfo;
    day?: PillarInfo;
    hour?: PillarInfo;
}

interface ElementDistribution {
    Wood?: number;
    Fire?: number;
    Earth?: number;
    Metal?: number;
    Water?: number;
}

export interface SajuAnalysis {
    distribution?: ElementDistribution;
    neededElements?: string[];
    excessElements?: string[];
}

interface ElementStory {
    element: string;
    status: ElementStatus;
    emoji: string;
    name: string;
    narrative: string;
}

interface FormattedPillar {
    label: string;
    display: string;
    reading?: string;
    element?: ElementType;
    stemEmoji: string;
    branchEmoji: string;
}

interface BranchInfo {
    emoji: string;
    animal: string;
    narrative: string;
}

interface StemInfo {
    narrative: string;
}

export interface SajuNarrativeResult {
    yearStory: string;
    branchInfo: BranchInfo | null;
    stemInfo: StemInfo | null;
    elementStories: ElementStory[];
    neededElements: string[];
    excessElements: string[];
    pillars: {
        year: FormattedPillar;
        month: FormattedPillar;
        day: FormattedPillar;
        hour: FormattedPillar;
    };
}

interface SuriStageData {
    count: number;
    info?: {
        level: string;
    };
}

interface SuriInfo {
    초년운?: SuriStageData;
    중년운?: SuriStageData;
    말년운?: SuriStageData;
    총운?: SuriStageData;
}

interface LuckInfo {
    level: string;
    emoji: string;
    label: string;
    color: string;
    narrative: string;
}

export interface SuriStageNarrative {
    stage: string;
    count: number;
    ageRange: string;
    description: string;
    luck: LuckInfo;
}

interface CompensationInfo {
    element: string;
    emoji: string;
    name: string;
    status: 'compensated';
    message: string;
}

export interface BalanceNarrativeResult {
    score: number;
    balanceLevel: BalanceLevel;
    message: string;
    compensation: CompensationInfo[];
    recommendation: string;
}

interface NarrativesData {
    yearBranch: Record<string, BranchInfo>;
    yearStem: Record<string, StemInfo>;
    elements: Record<string, { emoji: string; name: string; high: string; low: string }>;
    lifeStages: Record<string, { age: string; description: string }>;
    suri: Record<string, { emoji: string; label: string; color: string; narrative: string }>;
    balanceMessages: Record<string, string>;
}

// ==========================================
// Internal State
// ==========================================

const typedNarratives = sajuNarratives as NarrativesData;

// ==========================================
// Internal Functions
// ==========================================

function formatPillar(pillar: PillarInfo | undefined, label: string): FormattedPillar {
    if (!pillar) return { label, display: '-', element: undefined, stemEmoji: '', branchEmoji: '' };

    const stemInfo = typedNarratives.yearStem[pillar.stem || ''];
    const branchInfo = typedNarratives.yearBranch[pillar.branch || ''];

    return {
        label,
        display: `${pillar.stem || ''}${pillar.branch || ''}`,
        reading: pillar.reading,
        element: pillar.element,
        stemEmoji: stemInfo?.narrative || '',
        branchEmoji: branchInfo?.emoji || ''
    };
}

function generateRecommendation(balanceLevel: BalanceLevel, compensation: CompensationInfo[]): string {
    if (balanceLevel === 'excellent') {
        return '이 이름은 사주와 완벽하게 어울려요. 강력 추천드려요!';
    } else if (balanceLevel === 'good') {
        if (compensation.length > 0) {
            return `부족한 기운을 이름이 잘 보완해줘요. 좋은 선택이에요!`;
        }
        return '사주와 잘 어울리는 이름이에요.';
    } else if (balanceLevel === 'fair') {
        return '무난하게 어울리는 이름이에요.';
    } else {
        return '다른 이름과 비교해보시는 것도 좋아요.';
    }
}

// ==========================================
// Exported Functions
// ==========================================

export function generateSajuNarrative(saju: SajuData | null, analysis: SajuAnalysis | null): SajuNarrativeResult | null {
    if (!saju) return null;

    const yearBranch = saju.year?.branch;
    const yearStem = saju.year?.stem;

    const branchInfo = yearBranch ? typedNarratives.yearBranch[yearBranch] || null : null;
    const stemInfo = yearStem ? typedNarratives.yearStem[yearStem] || null : null;

    let yearStory = '';
    if (branchInfo && stemInfo) {
        yearStory = `${branchInfo.emoji} ${branchInfo.animal}띠로 태어났어요. ${branchInfo.narrative}`;
    }

    const elementStories: ElementStory[] = [];
    if (analysis && analysis.distribution) {
        const total = Object.values(analysis.distribution).reduce((a, b) => (a || 0) + (b || 0), 0) || 1;

        for (const [element, count] of Object.entries(analysis.distribution)) {
            const elementInfo = typedNarratives.elements[element];
            if (!elementInfo) continue;

            const ratio = (count || 0) / total;

            if (ratio >= 0.4) {
                elementStories.push({
                    element,
                    status: 'high',
                    emoji: elementInfo.emoji,
                    name: elementInfo.name,
                    narrative: elementInfo.high
                });
            } else if (count === 0) {
                elementStories.push({
                    element,
                    status: 'low',
                    emoji: elementInfo.emoji,
                    name: elementInfo.name,
                    narrative: elementInfo.low
                });
            }
        }
    }

    const neededElements = analysis?.neededElements || [];
    const excessElements = analysis?.excessElements || [];

    return {
        yearStory,
        branchInfo,
        stemInfo,
        elementStories,
        neededElements,
        excessElements,
        pillars: {
            year: formatPillar(saju.year, '년주'),
            month: formatPillar(saju.month, '월주'),
            day: formatPillar(saju.day, '일주'),
            hour: formatPillar(saju.hour, '시주')
        }
    };
}

export function generateSuriNarrative(suriInfo: SuriInfo | null): SuriStageNarrative[] | null {
    if (!suriInfo) return null;

    const stages: StageType[] = ['초년운', '중년운', '말년운'];
    const result: SuriStageNarrative[] = [];

    for (const stage of stages) {
        const stageData = suriInfo[stage];
        if (!stageData) continue;

        const stageInfo = typedNarratives.lifeStages[stage];
        const luckLevel = stageData.info?.level || '반길반흉';
        const luckInfo = typedNarratives.suri[luckLevel] || typedNarratives.suri['반길반흉'];

        result.push({
            stage,
            count: stageData.count,
            ageRange: stageInfo?.age || '',
            description: stageInfo?.description || '',
            luck: {
                level: luckLevel,
                emoji: luckInfo.emoji,
                label: luckInfo.label,
                color: luckInfo.color,
                narrative: luckInfo.narrative
            }
        });
    }

    if (suriInfo.총운) {
        const luckLevel = suriInfo.총운.info?.level || '반길반흉';
        const luckInfo = typedNarratives.suri[luckLevel] || typedNarratives.suri['반길반흉'];

        result.push({
            stage: '총운',
            count: suriInfo.총운.count,
            ageRange: '평생',
            description: '전체 인생의 흐름을 나타내요.',
            luck: {
                level: luckLevel,
                emoji: luckInfo.emoji,
                label: luckInfo.label,
                color: luckInfo.color,
                narrative: luckInfo.narrative
            }
        });
    }

    return result;
}

export function generateBalanceNarrative(
    _saju: SajuData | null,
    analysis: SajuAnalysis | null,
    nameElements: string[] | null,
    score: number
): BalanceNarrativeResult {
    let balanceLevel: BalanceLevel;
    if (score >= 90) balanceLevel = 'excellent';
    else if (score >= 75) balanceLevel = 'good';
    else if (score >= 60) balanceLevel = 'fair';
    else balanceLevel = 'needsWork';

    const message = typedNarratives.balanceMessages[balanceLevel] || '';

    const compensation: CompensationInfo[] = [];
    if (analysis?.neededElements && nameElements) {
        for (const needed of analysis.neededElements) {
            if (nameElements.includes(needed)) {
                const elementInfo = typedNarratives.elements[needed];
                compensation.push({
                    element: needed,
                    emoji: elementInfo?.emoji || '',
                    name: elementInfo?.name || needed,
                    status: 'compensated',
                    message: `부족한 ${elementInfo?.name || needed} 기운을 이름이 채워줘요!`
                });
            }
        }
    }

    return {
        score,
        balanceLevel,
        message,
        compensation,
        recommendation: generateRecommendation(balanceLevel, compensation)
    };
}
