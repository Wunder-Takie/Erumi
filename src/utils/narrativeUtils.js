/**
 * narrativeUtils.js
 * 내러티브 생성 유틸리티 - 사주, 수리, 균형 스토리 생성
 */

import sajuNarratives from '../data/saju/saju_narratives.json' with { type: 'json' };

/**
 * 사주 스토리 내러티브 생성
 * @param {object} saju - 사주 데이터 (year, month, day, hour pillars)
 * @param {object} analysis - 오행 분석 데이터
 * @returns {object} 내러티브 객체
 */
export function generateSajuNarrative(saju, analysis) {
    if (!saju) return null;

    const yearBranch = saju.year?.branch;
    const yearStem = saju.year?.stem;

    const branchInfo = sajuNarratives.yearBranch[yearBranch] || null;
    const stemInfo = sajuNarratives.yearStem[yearStem] || null;

    // 연도 스토리 생성
    let yearStory = '';
    if (branchInfo && stemInfo) {
        yearStory = `${branchInfo.emoji} ${branchInfo.animal}띠로 태어났어요. ${branchInfo.narrative}`;
    }

    // 오행 분석 스토리 생성
    const elementStories = [];
    if (analysis && analysis.distribution) {
        const total = Object.values(analysis.distribution).reduce((a, b) => a + b, 0);

        for (const [element, count] of Object.entries(analysis.distribution)) {
            const elementInfo = sajuNarratives.elements[element];
            if (!elementInfo) continue;

            const ratio = count / total;

            if (ratio >= 0.4) {
                // 과다 (40% 이상)
                elementStories.push({
                    element,
                    status: 'high',
                    emoji: elementInfo.emoji,
                    name: elementInfo.name,
                    narrative: elementInfo.high
                });
            } else if (count === 0) {
                // 부족
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

    // 필요/과다 오행 결정
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

/**
 * 기둥 정보 포맷팅
 */
function formatPillar(pillar, label) {
    if (!pillar) return { label, display: '-', element: null };

    const stemInfo = sajuNarratives.yearStem[pillar.stem];
    const branchInfo = sajuNarratives.yearBranch[pillar.branch];

    return {
        label,
        display: `${pillar.stem}${pillar.branch}`,
        reading: pillar.reading,
        element: pillar.element,
        stemEmoji: stemInfo?.narrative || '',
        branchEmoji: branchInfo?.emoji || ''
    };
}

/**
 * 수리 운세 내러티브 생성
 * @param {object} suriInfo - 수리 정보
 * @returns {object} 수리 내러티브
 */
export function generateSuriNarrative(suriInfo) {
    if (!suriInfo) return null;

    const stages = ['초년운', '중년운', '말년운'];
    const result = [];

    for (const stage of stages) {
        const stageData = suriInfo[stage];
        if (!stageData) continue;

        const stageInfo = sajuNarratives.lifeStages[stage];
        const luckLevel = stageData.info?.level || '반길반흉';
        const luckInfo = sajuNarratives.suri[luckLevel] || sajuNarratives.suri['반길반흉'];

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

    // 총운 추가
    if (suriInfo.총운) {
        const luckLevel = suriInfo.총운.info?.level || '반길반흉';
        const luckInfo = sajuNarratives.suri[luckLevel] || sajuNarratives.suri['반길반흉'];

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

/**
 * 종합 균형 내러티브 생성
 * @param {object} saju - 사주 데이터
 * @param {object} analysis - 사주 분석
 * @param {object} nameElements - 이름 오행
 * @param {number} score - 점수
 * @returns {object} 균형 내러티브
 */
export function generateBalanceNarrative(saju, analysis, nameElements, score) {
    // 점수 기반 균형 메시지
    let balanceLevel;
    if (score >= 90) balanceLevel = 'excellent';
    else if (score >= 75) balanceLevel = 'good';
    else if (score >= 60) balanceLevel = 'fair';
    else balanceLevel = 'needsWork';

    const message = sajuNarratives.balanceMessages[balanceLevel];

    // 보완 분석
    const compensation = [];
    if (analysis?.neededElements && nameElements) {
        for (const needed of analysis.neededElements) {
            if (nameElements.includes(needed)) {
                const elementInfo = sajuNarratives.elements[needed];
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

/**
 * 추천 문구 생성
 */
function generateRecommendation(balanceLevel, compensation) {
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
