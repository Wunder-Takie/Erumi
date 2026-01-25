/**
 * scoringUtils.ts
 * 스코어링 관련 함수들 - 보너스 점수, 발음 규칙, 의미 충돌, 현대성 점수 계산
 */

import modernPreferences from '../data/filter/modern_preferences.json' with { type: 'json' };
import phoneticRulesData from '../data/filter/phonetic_rules.json' with { type: 'json' };
import consonantElements from '../data/saju/consonant_elements.json' with { type: 'json' };
import namePopularity from '../data/popularity/name_popularity.json' with { type: 'json' };
import { decomposeHangul } from './hangulUtils';
import { ELEMENT_GENERATION, type ElementType } from './semanticScoring';

// ============================================
// Types
// ============================================

interface HanjaInfo {
    hanja: string;
    hangul: string;
    element: string;
    position: string;
    modernity?: number;
}

// ============================================
// 성씨-초성 상생 보너스 계산
// ============================================

/**
 * 성씨-초성 상생 보너스 계산
 * 성씨 오행과 상생하는 초성을 가진 이름에 보너스
 */
export function getSurnameHarmonyBonus(surnameElement: ElementType | null, hangul1: string, hangul2: string): number {
    if (!surnameElement) return 0;

    let bonus = 0;
    const d1 = decomposeHangul(hangul1);
    const d2 = decomposeHangul(hangul2);

    if (!d1 || !d2) return 0;

    const generatedElement = ELEMENT_GENERATION[surnameElement];
    const consonantData = consonantElements as { initial: Record<string, { element?: string }> };
    const initial1Element = consonantData.initial[d1.cho]?.element;
    const initial2Element = consonantData.initial[d2.cho]?.element;

    if (initial1Element === generatedElement) {
        bonus += 15;
    } else if (initial1Element === surnameElement) {
        bonus += 5;
    }

    if (initial1Element && initial2Element &&
        ELEMENT_GENERATION[initial1Element as ElementType] === initial2Element) {
        bonus += 10;
    }

    return bonus;
}

// ============================================
// 보너스 점수 계산
// ============================================

/**
 * 보너스 점수 계산
 */
export function calculateBonusScore(hanja1: HanjaInfo, hanja2: HanjaInfo): number {
    let bonus = 0;

    if (hanja1.position === 'first' && hanja2.position === 'last') bonus += 3;

    const yangElements = ['Wood', 'Fire'];
    const yinElements = ['Water', 'Metal', 'Earth'];
    const isYang1 = yangElements.includes(hanja1.element);
    const isYang2 = yangElements.includes(hanja2.element);
    const isYin1 = yinElements.includes(hanja1.element);
    const isYin2 = yinElements.includes(hanja2.element);

    if ((isYang1 && isYin2) || (isYin1 && isYang2)) bonus += 3;

    return Math.min(15, bonus);
}

// ============================================
// 발음 규칙 기반 점수 계산
// ============================================

/**
 * 발음 규칙 기반 점수 계산 (phonetic_rules.json 데이터 활용)
 */
export function calculatePhoneticsRuleScore(hangul1: string, hangul2: string): number {
    const d1 = decomposeHangul(hangul1);
    const d2 = decomposeHangul(hangul2);
    if (!d1 || !d2) return 0;

    let score = 0;
    const rules = phoneticRulesData as any;

    // 1. 모음 조화 체크
    if (rules.vowelHarmony) {
        const vh = rules.vowelHarmony;
        const isPos1 = vh.positive.includes(d1.jung);
        const isPos2 = vh.positive.includes(d2.jung);
        const isNeg1 = vh.negative.includes(d1.jung);
        const isNeg2 = vh.negative.includes(d2.jung);

        if ((isPos1 && isPos2) || (isNeg1 && isNeg2)) {
            score += vh.harmonyBonus || 3;
        }
        if ((isPos1 && isNeg2) || (isNeg1 && isPos2)) {
            score += vh.disharmonyPenalty || -5;
        }
    }

    // 2. 초성 흐름 체크
    if (rules.onsetFlow) {
        const onset = rules.onsetFlow;

        if (onset.smoothPairs?.pairs?.some((p: string[]) => p[0] === d1.cho && p[1] === d2.cho)) {
            score += onset.smoothPairs.bonus || 3;
        }

        if (onset.roughPairs?.pairs?.some((p: string[]) => p[0] === d1.cho && p[1] === d2.cho)) {
            score += onset.roughPairs.penalty || -5;
        }

        if (d1.cho === d2.cho && d1.cho !== 'ㅇ') {
            score += onset.sameOnset?.penalty || -10;
        }
    }

    // 3. 종성-초성 연결 체크
    if (rules.codaFlow) {
        const coda = rules.codaFlow;

        coda.smoothConnections?.patterns?.forEach((p: { coda: string; onset: string | string[]; bonus?: number }) => {
            if (d1.jong === p.coda &&
                (p.onset === 'any' || (Array.isArray(p.onset) && p.onset.includes(d2.cho)))) {
                score += p.bonus || 2;
            }
        });

        coda.roughConnections?.patterns?.forEach((p: { coda: string; onset: string; penalty?: number }) => {
            if (d1.jong === p.coda && d2.cho === p.onset) {
                score += p.penalty || -10;
            }
        });
    }

    // 4. 끝 글자 종성 선호도
    if (rules.endingPreferences?.scores) {
        const endScore = rules.endingPreferences.scores[d2.jong] || 0;
        score += endScore;
    }

    return score;
}

// ============================================
// 의미 충돌 점수
// ============================================

/**
 * 의미 충돌 점수 (일상어, 전문용어, 부정 연상 감지)
 */
export function getSemanticRiskScore(hangul1: string, hangul2: string): number {
    const endingChar = hangul2;

    if (endingChar === '도' && ['지', '성', '제', '태'].includes(hangul1)) {
        return -20;
    }

    if (endingChar === '유' && !['지', '서', '준', '하'].includes(hangul1)) {
        return -10;
    }

    if (endingChar === '희') {
        return -30;
    }

    if (endingChar === '자' && ['영', '순', '옥', '분', '복', '필', '경', '춘', '말', '금'].includes(hangul1)) {
        return -40;
    }

    return 0;
}

// ============================================
// 현대성 점수 계산
// ============================================

/**
 * 현대성 점수 계산
 */
export function calculateModernityScore(hanja1: HanjaInfo, hanja2: HanjaInfo): number {
    let score = 0;

    const d1 = decomposeHangul(hanja1.hangul);
    const d2 = decomposeHangul(hanja2.hangul);
    if (!d1 || !d2) return 0;

    const combination = hanja1.hangul + hanja2.hangul;
    const prefs = modernPreferences as any;

    // Critical blocks 체크
    if (prefs.critical_blocks?.includes(combination)) {
        return -999;
    }

    // 🆕 v6.0: 올드한 이름 조합 페널티는 nameModernityAnalyzer.ts로 일원화됨

    // Awkward combinations 체크
    if (prefs.awkward_combinations?.combinations) {
        const found = prefs.awkward_combinations.combinations.find(
            (c: { name: string; severity: string }) => c.name === combination
        );
        if (found) {
            if (found.severity === 'critical') return -999;
            else if (found.severity === 'warning') score -= 30;
        }
    }

    // 받침/모음 선호도
    const jong1Score = prefs.jongseong_scores?.[d1.jong] || 0;
    const jong2Score = prefs.jongseong_scores?.[d2.jong] || 0;
    score += (jong1Score + jong2Score) / 2;

    const vowel1Score = prefs.vowel_scores?.[d1.jung] || 5;
    const vowel2Score = prefs.vowel_scores?.[d2.jung] || 5;
    score += (vowel1Score + vowel2Score) / 2;

    // 고풍스러운 한자/음절 페널티
    const archaic1 = prefs.archaic_hanja?.find((a: { hanja: string; hangul: string; penalty: number }) =>
        a.hanja === hanja1.hanja || a.hangul === hanja1.hangul);
    const archaic2 = prefs.archaic_hanja?.find((a: { hanja: string; hangul: string; penalty: number }) =>
        a.hanja === hanja2.hanja || a.hangul === hanja2.hangul);
    if (archaic1) score -= archaic1.penalty;
    if (archaic2) score -= archaic2.penalty;

    // 2020년대 인기 음절 보너스/페널티
    const pop = (namePopularity as any).syllablePopularity;
    if (pop) {
        if (pop[hanja1.hangul]?.score !== undefined) {
            score += Math.round((pop[hanja1.hangul].score - 50) / 5);
        }
        if (pop[hanja2.hangul]?.score !== undefined) {
            score += Math.round((pop[hanja2.hangul].score - 50) / 5);
        }
    }

    // 어색한 발음 패턴
    if (prefs.awkward_phonetic_patterns) {
        for (const pattern of prefs.awkward_phonetic_patterns) {
            if (pattern.type === 'same_vowel' && pattern.vowels?.includes(d1.jung) && d1.jung === d2.jung) {
                score -= pattern.penalty;
            }
        }
    }

    // 발음 어려운 조합
    if (prefs.difficult_pronunciation) {
        for (const pattern of prefs.difficult_pronunciation) {
            if (d1.jong === pattern.jong1 && d2.cho === pattern.cho2) {
                score -= pattern.penalty;
            }
        }
    }

    // 같은 글자 반복
    if (hanja1.hangul === hanja2.hangul) {
        score -= 40;
    }

    // 모음 조화 필터
    const awkwardVowelRepetitions = ["ㅐ", "ㅔ", "ㅚ", "ㅟ"];
    if (d1.jung === d2.jung) {
        if (["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ"].includes(d1.jung)) {
            score -= 35;
        } else if (awkwardVowelRepetitions.includes(d1.jung)) {
            score -= 50;
        }
    }

    // Modernity 평균 페널티
    const mod1 = hanja1.modernity || 5;
    const mod2 = hanja2.modernity || 5;
    const avgModernity = (mod1 + mod2) / 2;

    if (avgModernity < 5) score -= 15;
    else if (avgModernity < 6) score -= 10;
    else if (avgModernity < 7) score -= 5;

    if (mod1 < 5 && mod2 < 5) score -= 10;

    // 음운 조화 검사
    if (d1.jong && d1.jong === d2.cho && d2.cho !== 'ㅇ') {
        score -= 10;
    }

    // ㄴ-ㄹ 충돌
    if ((d1.jong === 'ㄴ' && d2.cho === 'ㄹ') ||
        (d1.jong === 'ㄹ' && d2.cho === 'ㄴ')) {
        score -= 10;
    }

    if (prefs.overused_combinations?.includes(combination)) {
        score -= 30;
    }

    // 🆕 v6.0: 트렌디 패턴 보너스는 nameModernityAnalyzer.ts로 일원화됨

    // 발음 단순성 보너스
    if (prefs.syllable_simplicity_bonus) {
        const easyList = prefs.syllable_simplicity_bonus.easy_syllables || [];
        const bonusPerMatch = prefs.syllable_simplicity_bonus.bonus_per_match || 2;
        if (easyList.includes(hanja1.hangul)) score += bonusPerMatch;
        if (easyList.includes(hanja2.hangul)) score += bonusPerMatch;
    }

    return Math.max(-50, Math.min(40, score));
}

// ============================================
// 점수 정규화
// ============================================

interface NameCombinationForNormalize {
    hanja1?: { modernity?: number };
    hanja2?: { modernity?: number };
    suri?: any;
    rawScore?: number;
    score?: number;
    modernityAvg?: number;
    suriTier?: string;
    passesGate?: boolean;
    gateInfo?: any;
    scoreBreakdown?: any;
    hanjaName?: string;
}

/**
 * 티어계수 기반 점수 정규화
 * - 티어계수를 rawScore에 곱셈 적용
 * - 수리품질 보너스/페널티 추가
 * - 점수 순 정렬 (단일 sort)
 */
export function normalizeScores<T extends NameCombinationForNormalize>(combinations: T[]): T[] {
    if (combinations.length === 0) return combinations;

    const getSuriTier = (suri: any): string => {
        if (!suri) return 'D';

        const levels = [
            suri.초년운?.info?.level,
            suri.중년운?.info?.level,
            suri.말년운?.info?.level,
            suri.총운?.info?.level
        ];

        if (levels.includes('흉') || levels.includes('대흉')) return 'D';
        const 반길반흉Count = levels.filter((l: string) => l === '반길반흉').length;
        if (반길반흉Count >= 2) return 'C';
        if (반길반흉Count === 1) return 'B';
        if (levels.every((l: string) => l === '대길')) return 'S';
        return 'A';
    };

    const analyzeSuriQuality = (suri: any): { badCount: number; daegilCount: number } => {
        if (!suri) return { badCount: 4, daegilCount: 0 };
        let badCount = 0, daegilCount = 0;
        for (const key of ['초년운', '중년운', '말년운', '총운']) {
            const level = suri[key]?.info?.level || '흉';
            if (level === '반길반흉' || level === '흉') badCount++;
            if (level === '대길') daegilCount++;
        }
        return { badCount, daegilCount };
    };

    // 🆕 v6.0: 1000점 시스템 - 배율 확대
    const TIER_MULTIPLIER: Record<string, number> = { 'S': 5.0, 'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0 };

    combinations.forEach((c: NameCombinationForNormalize) => {
        const tier = getSuriTier(c.suri);
        c.suriTier = tier;
        const quality = analyzeSuriQuality(c.suri);
        const mod1 = c.hanja1?.modernity || 5;
        const mod2 = c.hanja2?.modernity || 5;
        c.modernityAvg = (mod1 + mod2) / 2;

        const multiplier = TIER_MULTIPLIER[tier];
        let adjustedScore = (c.rawScore || 50) * multiplier;
        // 🆕 v6.0: 수리 보너스/페널티 확대
        adjustedScore += quality.daegilCount * 15;
        adjustedScore -= quality.badCount * 25;
        // 🆕 v6.0: Cap 제거 - 최소 200점, 상한 없음
        c.score = Math.round(Math.max(200, adjustedScore));

        c.passesGate = (tier === 'S' || tier === 'A');
        c.gateInfo = {
            suriTier: tier,
            suriTierLabel: tier === 'S' ? '전체 대길' : tier === 'A' ? '전체 길 이상' :
                tier === 'B' ? '반길반흉 1개' : tier === 'C' ? '반길반흉 2개+' : '흉 포함'
        };
        c.scoreBreakdown = c.scoreBreakdown || {};
        c.scoreBreakdown.final = c.score;
        c.scoreBreakdown.modernityAvg = c.modernityAvg;
        c.scoreBreakdown.suriTier = tier;
    });

    combinations.sort((a: NameCombinationForNormalize, b: NameCombinationForNormalize) => {
        const scoreDiff = (b.score || 0) - (a.score || 0);
        if (scoreDiff !== 0) return scoreDiff;
        const qA = analyzeSuriQuality(a.suri), qB = analyzeSuriQuality(b.suri);
        if (qA.badCount !== qB.badCount) return qA.badCount - qB.badCount;
        if (qB.daegilCount !== qA.daegilCount) return qB.daegilCount - qA.daegilCount;
        return (b.modernityAvg || 0) - (a.modernityAvg || 0);
    });

    combinations.forEach((c: NameCombinationForNormalize, idx: number) => {
        if (c.scoreBreakdown) c.scoreBreakdown.rank = idx + 1;
    });

    const tiers = ['S', 'A', 'B', 'C', 'D'];
    console.log(`📊 티어: ${tiers.map(t => `${t}:${combinations.filter((c: NameCombinationForNormalize) => c.suriTier === t).length}`).join(' ')}`);
    console.log(`🏆 Top5: ${combinations.slice(0, 5).map((c: NameCombinationForNormalize) => `${c.hanjaName}(${c.suriTier}/${c.score})`).join(', ')}`);

    return combinations;
}
