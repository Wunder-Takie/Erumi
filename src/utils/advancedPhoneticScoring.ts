/**
 * advancedPhoneticScoring.ts
 * 고급 발음 스코어링 함수들 - 성씨-이름 조합, 3글자 패턴, 로마자, 리듬, 난이도 평가
 */

import phoneticRulesData from '../data/filter/phonetic_rules.json' with { type: 'json' };
import popularNgrams from '../data/popularity/popular_ngrams.json' with { type: 'json' };
import namePopularity from '../data/popularity/name_popularity.json' with { type: 'json' };
import { decomposeHangul, type DecomposedHangul } from './hangulUtils';

// ============================================
// Types
// ============================================

type PhoneticRulesData = typeof phoneticRulesData;
type PopularNgrams = typeof popularNgrams;
type NamePopularity = typeof namePopularity;

// ============================================
// 성씨-이름 조합 발음 점수
// ============================================

/**
 * 성씨-이름 조합 발음 점수
 * 성씨 종성과 이름 첫 글자 초성의 조화 평가
 */
export function calculateSurnameNameFlowScore(surname: string, hangul1: string): number {
    const rules = (phoneticRulesData as PhoneticRulesData & { surnameCodaOnset?: { commonSurnames?: Record<string, { coda: string }>; patterns?: Array<{ surname_coda: string; onset: string; bonus?: number; penalty?: number }> } }).surnameCodaOnset;
    if (!rules) return 0;

    const surnameData = rules.commonSurnames?.[surname];
    if (!surnameData) return 0;

    const surnameCoda = surnameData.coda;
    const d1 = decomposeHangul(hangul1);
    if (!d1) return 0;

    for (const pattern of rules.patterns || []) {
        if (pattern.surname_coda === surnameCoda && pattern.onset === d1.cho) {
            return pattern.bonus || -(pattern.penalty || 0);
        }
    }

    return 0;
}

// ============================================
// 3글자 발음 패턴 점수
// ============================================

/**
 * 3글자 발음 패턴 점수 (성+이름)
 * CVC-CV-CV 등 음절 구조 평가
 */
export function calculateThreeSyllablePatternScore(surname: string, hangul1: string, hangul2: string): number {
    const rules = (phoneticRulesData as PhoneticRulesData & { threeSyllablePatterns?: { preferred?: Array<{ pattern: string; bonus?: number }>; avoided?: Array<{ pattern: string; penalty?: number }> } }).threeSyllablePatterns;
    if (!rules) return 0;

    const ds = decomposeHangul(surname);
    const d1 = decomposeHangul(hangul1);
    const d2 = decomposeHangul(hangul2);
    if (!ds || !d1 || !d2) return 0;

    const getStructure = (d: DecomposedHangul): string => {
        let s = 'CV';
        if (d.jong === 'ㅇ') s += 'NG';
        else if (d.jong) s += 'C';
        if (d.jong === 'ㄴ') s = 'CVN';
        return s;
    };

    const pattern = `${getStructure(ds)}-${getStructure(d1)}-${getStructure(d2)}`;

    for (const p of rules.preferred || []) {
        if (p.pattern === pattern) return p.bonus || 0;
    }

    for (const p of rules.avoided || []) {
        if (p.pattern === pattern) return -(p.penalty || 0);
    }

    return 0;
}

// ============================================
// 로마자 발음 호환성 점수
// ============================================

/**
 * 로마자 발음 호환성 점수
 * 글로벌 친화적인 발음 평가
 */
export function calculateRomanizationScore(hangul1: string, hangul2: string): number {
    const rules = (phoneticRulesData as PhoneticRulesData & { romanizationFlow?: { easyRoman?: { syllables?: string[]; bonus?: number }; difficultRoman?: { syllables?: string[]; penalty?: number } } }).romanizationFlow;
    if (!rules) return 0;

    let score = 0;

    if (rules.easyRoman?.syllables?.includes(hangul1)) score += rules.easyRoman.bonus || 0;
    if (rules.easyRoman?.syllables?.includes(hangul2)) score += rules.easyRoman.bonus || 0;

    if (rules.difficultRoman?.syllables?.includes(hangul1)) score -= rules.difficultRoman.penalty || 0;
    if (rules.difficultRoman?.syllables?.includes(hangul2)) score -= rules.difficultRoman.penalty || 0;

    return score;
}

// ============================================
// 리듬/억양 점수
// ============================================

/**
 * 이름 리듬/억양 점수
 * 음절의 무게감 균형 평가
 */
export function calculateRhythmScore(hangul1: string, hangul2: string): number {
    const rules = (phoneticRulesData as PhoneticRulesData & { rhythmPatterns?: { syllableWeight?: { light?: string[]; heavy?: string[] }; patterns?: Array<{ type: string; bonus?: number; penalty?: number }> } }).rhythmPatterns;
    if (!rules) return 0;

    const weights = rules.syllableWeight;
    if (!weights) return 0;

    const getWeight = (syllable: string): 'light' | 'heavy' | 'medium' => {
        if (weights.light?.includes(syllable)) return 'light';
        if (weights.heavy?.includes(syllable)) return 'heavy';
        return 'medium';
    };

    const w1 = getWeight(hangul1);
    const w2 = getWeight(hangul2);

    let rhythmType = 'balanced';
    if (w1 === 'light' && w2 === 'heavy') rhythmType = 'rising';
    else if (w1 === 'heavy' && w2 === 'light') rhythmType = 'falling';
    else if (w1 === 'heavy' && w2 === 'heavy') rhythmType = 'heavy';

    for (const p of rules.patterns || []) {
        if (p.type === rhythmType) {
            return p.bonus || -(p.penalty || 0);
        }
    }

    return 0;
}

// ============================================
// 발음 난이도 점수
// ============================================

/**
 * 발음 난이도 점수
 * 유아 친화, 공식 석상 명확성 평가
 */
export function calculatePronunciationDifficultyScore(hangul1: string, hangul2: string): number {
    const rules = (phoneticRulesData as PhoneticRulesData & { pronunciationDifficulty?: { childFriendly?: { onsets?: string[]; bonus?: number }; difficultOnsets?: { onsets?: string[]; penalty?: number } } }).pronunciationDifficulty;
    if (!rules) return 0;

    const d1 = decomposeHangul(hangul1);
    const d2 = decomposeHangul(hangul2);
    if (!d1 || !d2) return 0;

    let score = 0;

    if (rules.childFriendly?.onsets?.includes(d1.cho)) score += (rules.childFriendly.bonus || 0) / 2;
    if (rules.childFriendly?.onsets?.includes(d2.cho)) score += (rules.childFriendly.bonus || 0) / 2;

    if (rules.difficultOnsets?.onsets?.includes(d1.cho)) score -= rules.difficultOnsets.penalty || 0;
    if (rules.difficultOnsets?.onsets?.includes(d2.cho)) score -= rules.difficultOnsets.penalty || 0;

    return score;
}

// ============================================
// 음운 흐름 점수 (강화 버전)
// ============================================

/**
 * 음운 흐름 점수 계산 (강화 버전)
 * 모음 조화, 받침-초성 연결, 종성 밸런스 평가
 */
export function calculatePhoneticFlowScore(hangul1: string, hangul2: string): number {
    const d1 = decomposeHangul(hangul1);
    const d2 = decomposeHangul(hangul2);
    if (!d1 || !d2) return 0;

    let score = 0;

    // 1. 모음 조화 (양성/음성 모음)
    const yangVowels = ['ㅏ', 'ㅗ', 'ㅑ', 'ㅛ', 'ㅘ', 'ㅙ'];
    const eumVowels = ['ㅓ', 'ㅜ', 'ㅕ', 'ㅠ', 'ㅝ', 'ㅞ'];

    const isYang1 = yangVowels.includes(d1.jung);
    const isYang2 = yangVowels.includes(d2.jung);
    const isEum1 = eumVowels.includes(d1.jung);
    const isEum2 = eumVowels.includes(d2.jung);

    if ((isYang1 && isYang2) || (isEum1 && isEum2)) score += 5;
    if ((isYang1 && isEum2) || (isEum1 && isYang2)) score -= 3;

    // 2. 받침 → 초성 연결 자연스러움
    const smoothTransitions: Record<string, string[]> = {
        'ㄴ': ['ㅁ', 'ㅇ', 'ㅎ', 'ㅈ', 'ㅅ', 'ㄹ'],
        'ㅇ': ['ㅎ', 'ㅇ', 'ㅁ', 'ㄴ'],
        'ㄱ': ['ㅅ', 'ㅈ', 'ㅎ'],
        'ㄹ': ['ㄹ', 'ㅇ', 'ㅁ', 'ㄴ'],
        '': ['ㄴ', 'ㅁ', 'ㅇ', 'ㅎ', 'ㅈ', 'ㅅ', 'ㄹ']
    };
    if (smoothTransitions[d1.jong]?.includes(d2.cho)) score += 5;

    // 3. 종성 밸런스
    if (d1.jong && !d2.jong) score += 3;
    if (!d1.jong && !d2.jong) score -= 5;
    if (d1.jong && d2.jong) score += 1;

    // 4. ㅣ 모음 연속 페널티
    if (d1.jung === 'ㅣ' && d2.jung === 'ㅣ') score -= 8;

    // 5. ㅓ+ㅣ 또는 ㅓ+ㅡ 흐름 페널티
    if (d1.jung === 'ㅓ' && (d2.jung === 'ㅣ' || d2.jung === 'ㅡ')) score -= 5;

    // 격음/경음 페널티
    const aspiratedConsonants = ['ㅋ', 'ㅌ', 'ㅍ', 'ㅊ'];
    const tenseConsonants = ['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ'];

    const popularFirst = ['태', '찬', '채', '철', '천', '탁'];
    const popularSecond = ['찬', '철', '태', '탁', '채', '천'];

    if (aspiratedConsonants.includes(d1.cho)) {
        if (!popularFirst.includes(hangul1)) score -= 15;
    }

    if (aspiratedConsonants.includes(d2.cho)) {
        if (!popularSecond.includes(hangul2)) score -= 25;
    }

    if (aspiratedConsonants.includes(d1.cho) && aspiratedConsonants.includes(d2.cho)) {
        if (!popularFirst.includes(hangul1) || !popularSecond.includes(hangul2)) score -= 35;
    }

    if (tenseConsonants.includes(d1.cho) || tenseConsonants.includes(d2.cho)) score -= 20;

    // 세련된 패턴 보너스
    const softInitials = ['ㄹ', 'ㄴ', 'ㅁ', 'ㅈ', 'ㅅ'];
    const cleanEndings = ['ㄴ', 'ㅁ', 'ㅇ'];

    if (!d1.jong && softInitials.includes(d2.cho) && cleanEndings.includes(d2.jong)) score += 15;

    if (d2.cho === 'ㄹ' && d2.jong === 'ㄴ') score += 5;

    const softStartConsonants = ['ㅇ', 'ㅅ', 'ㅎ', 'ㅁ', 'ㄴ', 'ㅈ'];
    if (softStartConsonants.includes(d1.cho)) score += 3;

    return score;
}

// ============================================
// N-gram 인기도 점수
// ============================================

/**
 * N-gram 인기도 점수
 * 실제 통계 데이터 기반 인기 이름 평가
 */
export function getPopularityScore(hangul1: string, hangul2: string): number {
    const combination = hangul1 + hangul2;
    let score = 0;

    // 1. 기존 N-gram 점수
    const ngrams = popularNgrams as PopularNgrams & { positive?: Record<string, number>; negative?: Record<string, number> };
    if (ngrams.positive?.[combination]) score += ngrams.positive[combination];
    if (ngrams.negative?.[combination]) score += ngrams.negative[combination];

    // 2. 실제 인기도 데이터 활용
    const popularity = namePopularity as NamePopularity & {
        syllablePopularity?: Record<string, { score?: number; trend?: string }>;
        trendingCombinations?: { rising?: Array<{ name: string; score: number }>; declining?: Array<{ name: string; score: number }> };
        modernPatterns?: { preferredBeginnings?: { M?: string[]; F?: string[] }; preferredEndings?: { M?: string[]; F?: string[] }; avoidedBeginnings?: string[]; avoidedEndings?: string[] };
    };

    if (popularity.syllablePopularity) {
        const pop = popularity.syllablePopularity;
        const syl1Score = pop[hangul1]?.score || 0;
        const syl2Score = pop[hangul2]?.score || 0;
        score += (syl1Score + syl2Score) * 0.15;

        const trend1 = pop[hangul1]?.trend;
        const trend2 = pop[hangul2]?.trend;
        if (trend1 === 'rising') score += 5;
        if (trend2 === 'rising') score += 5;
        if (trend1 === 'declining') score -= 8;
        if (trend2 === 'declining') score -= 8;
    }

    // 3. 트렌딩 조합 보너스/페널티
    if (popularity.trendingCombinations) {
        const rising = popularity.trendingCombinations.rising || [];
        const declining = popularity.trendingCombinations.declining || [];

        const isRising = rising.find((r: { name: string; score: number }) => r.name === combination);
        const isDeclining = declining.find((d: { name: string; score: number }) => d.name === combination);

        if (isRising) score += isRising.score * 0.3;
        if (isDeclining) score += isDeclining.score * 0.5;
    }

    // 4. 현대적 패턴 매칭
    if (popularity.modernPatterns) {
        const patterns = popularity.modernPatterns;

        if (patterns.preferredBeginnings?.M?.includes(hangul1) ||
            patterns.preferredBeginnings?.F?.includes(hangul1)) {
            score += 8;
        }

        if (patterns.preferredEndings?.M?.includes(hangul2) ||
            patterns.preferredEndings?.F?.includes(hangul2)) {
            score += 8;
        }

        if (patterns.avoidedBeginnings?.includes(hangul1)) score -= 15;
        if (patterns.avoidedEndings?.includes(hangul2)) score -= 20;
    }

    return score;
}
