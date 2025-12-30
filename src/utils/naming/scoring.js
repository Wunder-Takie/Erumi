/**
 * scoring.js
 * 점수 계산 로직
 */

import { decomposeHangul } from './helpers.js';
import { ELEMENT_GENERATION, ELEMENT_DESTRUCTION } from './constants.js';
import modernPreferences from '../../data/modern_preferences.json' with { type: 'json' };

/**
 * 고급 오행 점수 계산 (상생/상극 포함)
 */
export function calculateAdvancedElementScore(hanja1, hanja2, surnameInfo, elementWeights) {
    let score = 0;
    const el1 = hanja1.element;
    const el2 = hanja2.element;

    // 1. 기본 점수 20점
    score += 20;

    // 2. 상생 보너스
    if (ELEMENT_GENERATION[el1] === el2) score += 10;
    if (surnameInfo && surnameInfo.element && ELEMENT_GENERATION[surnameInfo.element] === el1) score += 5;

    // 3. 상극 페널티
    if (ELEMENT_DESTRUCTION[el1] === el2) score -= 10;

    // 4. 태그 보너스
    if (elementWeights[el1] && elementWeights[el1] > 0) score += 2.5;
    if (elementWeights[el2] && elementWeights[el2] > 0) score += 2.5;

    return Math.max(0, Math.min(40, score));
}

/**
 * Fair Suri 점수 계산 (공정성 개선, 우수성 보상)
 * 기본 15점 보장, 최대 40점
 */
export function calculateWeightedSuriScore(suriInfo) {
    // 1단계: 기본 보장 (15점)
    let score = 15;

    // 2단계: 중요 운세 평가
    const 중년운Level = suriInfo.중년운?.info?.level;
    const 총운Level = suriInfo.총운?.info?.level;

    // 중년운 (사회생활) - 최대 10점
    if (중년운Level === '대길') score += 10;
    else if (중년운Level === '길') score += 5;

    // 총운 (전체 운세) - 최대 12점
    if (총운Level === '대길') score += 12;
    else if (총운Level === '길') score += 6;

    // 3단계: 보조 운세 보너스
    if (suriInfo.초년운?.info?.level === '대길') score += 4;
    if (suriInfo.말년운?.info?.level === '대길') score += 6;

    // 4단계: 4대길 완벽 조합 보너스
    const all대길 = Object.values(suriInfo).every(v => v?.info?.level === '대길');
    if (all대길) score += 3;

    // 최소 15점, 최대 40점
    return Math.max(15, Math.min(40, score));
}

/**
 * 보너스 점수 계산
 */
export function calculateBonusScore(hanja1, hanja2) {
    let bonus = 0;

    // 1. Position 매칭
    if (hanja1.position === 'first' && hanja2.position === 'last') bonus += 3;

    // 2. 음양 조화
    const yangElements = ['Wood', 'Fire'];
    const yinElements = ['Water', 'Metal', 'Earth'];
    const isYang1 = yangElements.includes(hanja1.element);
    const isYang2 = yangElements.includes(hanja2.element);
    const isYin1 = yinElements.includes(hanja1.element);
    const isYin2 = yinElements.includes(hanja2.element);

    if ((isYang1 && isYin2) || (isYin1 && isYang2)) bonus += 3;

    return Math.min(15, bonus);
}

/**
 * 현대성 점수 계산 (Tier 1 모음 조화 필터 포함)
 */
export function calculateModernityScore(hanja1, hanja2) {
    let score = 0;

    const d1 = decomposeHangul(hanja1.hangul);
    const d2 = decomposeHangul(hanja2.hangul);
    if (!d1 || !d2) return 0;

    // 1. 받침/모음 선호도
    const jong1Score = modernPreferences.jongseong_scores[d1.jong] || 0;
    const jong2Score = modernPreferences.jongseong_scores[d2.jong] || 0;
    score += (jong1Score + jong2Score) / 2;

    const vowel1Score = modernPreferences.vowel_scores[d1.jung] || 5;
    const vowel2Score = modernPreferences.vowel_scores[d2.jung] || 5;
    score += (vowel1Score + vowel2Score) / 2;

    // 2. 고풍스러운 한자/음절 페널티
    const archaic1 = modernPreferences.archaic_hanja.find(a => a.hanja === hanja1.hanja || a.hangul === hanja1.hangul);
    const archaic2 = modernPreferences.archaic_hanja.find(a => a.hanja === hanja2.hanja || a.hangul === hanja2.hangul);
    if (archaic1) score -= archaic1.penalty;
    if (archaic2) score -= archaic2.penalty;

    // 🆕 archaic_hanja_syllables 체크
    if (modernPreferences.archaic_hanja_syllables) {
        const archaic = modernPreferences.archaic_hanja_syllables;
        if (archaic[hanja1.hangul]) score += archaic[hanja1.hangul];
        if (archaic[hanja2.hangul]) score += archaic[hanja2.hangul];
    }

    // 3. 2020년대 인기 음절 보너스/페널티
    if (modernPreferences.popular_syllables_2020s) {
        const pop = modernPreferences.popular_syllables_2020s;
        if (pop[hanja1.hangul]) score += pop[hanja1.hangul];
        if (pop[hanja2.hangul]) score += pop[hanja2.hangul];
    }

    // 4. 발음 흐름 체크
    if (modernPreferences.awkward_phonetic_patterns) {
        for (const pattern of modernPreferences.awkward_phonetic_patterns) {
            if (pattern.type === 'same_vowel' && pattern.vowels && pattern.vowels.includes(d1.jung) && d1.jung === d2.jung) {
                score -= pattern.penalty;
            }
        }
    }

    // 🆕 발음 어려운 조합 체크
    if (modernPreferences.difficult_pronunciation) {
        for (const pattern of modernPreferences.difficult_pronunciation) {
            if (d1.jong === pattern.jong1 && d2.cho === pattern.cho2) {
                score -= pattern.penalty;
            }
        }
    }

    // 5. 어색한 조합 (하드코딩된 강력 필터)
    if (hanja1.hangul === hanja2.hangul) {
        score -= 40; // 같은 글자 반복
    }

    // 🆕 Tier 1: 강화된 모음 조화 필터
    const awkwardVowelRepetitions = ["ㅐ", "ㅔ", "ㅚ", "ㅟ"];

    if (d1.jung === d2.jung) {
        if (["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ"].includes(d1.jung)) {
            score -= 35; // 기본 모음 반복
        } else if (awkwardVowelRepetitions.includes(d1.jung)) {
            score -= 50; // 어색한 모음 반복 (더 강력한 페널티)
        }
    }

    // 🆕 로직 기반 필터: Modernity 평균 페널티
    const mod1 = hanja1.modernity || 5;
    const mod2 = hanja2.modernity || 5;
    const avgModernity = (mod1 + mod2) / 2;

    if (avgModernity < 5) {
        score -= 15; // 매우 올드함
    } else if (avgModernity < 6) {
        score -= 10; // 올드함
    } else if (avgModernity < 7) {
        score -= 5;  // 약간 올드함
    }

    // 둘 다 매우 올드하면 추가 페널티
    if (mod1 < 5 && mod2 < 5) {
        score -= 10; // 치명적 조합
    }

    // 🆕 로직 기반 필터: 음운 조화 검사
    if (d1.jong && d1.jong === d2.cho && d2.cho !== 'ㅇ') {
        score -= 10; // 발음 어색함
    }

    // ㄴ-ㄹ 충돌
    if ((d1.jong === 'ㄴ' && d2.cho === 'ㄹ') ||
        (d1.jong === 'ㄹ' && d2.cho === 'ㄴ')) {
        score -= 10; // 발음 어려움
    }

    const combination = hanja1.hangul + hanja2.hangul;
    if (modernPreferences.overused_combinations && modernPreferences.overused_combinations.includes(combination)) {
        score -= 30;
    }

    // 6. 트렌디/단순성 보너스
    if (modernPreferences.syllable_simplicity_bonus) {
        const easyList = modernPreferences.syllable_simplicity_bonus.easy_syllables || [];
        if (easyList.includes(hanja1.hangul)) score += 2;
        if (easyList.includes(hanja2.hangul)) score += 2;
    }

    return Math.max(-20, Math.min(40, score));
}
