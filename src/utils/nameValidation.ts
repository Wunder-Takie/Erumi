/**
 * nameValidation.ts
 * 이름 검증 함수들 - 글로벌 리스크, 금지어, 동음이의어, 발음 규칙 체크
 */

import modernPreferences from '../data/filter/modern_preferences.json' with { type: 'json' };
import bunpaCharacters from '../data/scoring/bunpa_characters.json' with { type: 'json' };
import phoneticRulesData from '../data/filter/phonetic_rules.json' with { type: 'json' };
import { decomposeHangul } from './hangulUtils';

// ============================================
// Types
// ============================================

interface GlobalRiskEntry {
    bad_word: string;
    severity: 'critical' | 'warning';
    reason?: string;
    alternative?: string;
}

interface BadCombinationEntry {
    word: string;
}

interface HomophoneRiskEntry {
    word: string;
    reason: string;
    severity?: string;
    category?: string;
}

interface CommonWordEntry {
    word: string;
    category: string;
    severity: string;
    reason: string;
}

interface RiskResult {
    type: string;
    word: string;
    reason?: string;
    severity?: string;
    category?: string;
}

type BunpaSeverity = 'strong' | 'medium' | 'mild' | null;

// ============================================
// Internal Data
// ============================================

const globalRisk = (modernPreferences as { global_risk?: GlobalRiskEntry[] }).global_risk || [];
const badCombinations = (modernPreferences as { bad_combinations?: BadCombinationEntry[] }).bad_combinations || [];
const homophoneRisks = (modernPreferences as { homophone_risks_legacy?: HomophoneRiskEntry[] }).homophone_risks_legacy || [];
const commonWords = { common_words: (modernPreferences as { common_words_list?: CommonWordEntry[] }).common_words_list || [] };

const bunpaData = bunpaCharacters as {
    severity: {
        strong_bunpa: string[];
        medium_bunpa: string[];
        mild_bunpa: string[];
    };
};

const phoneticRules = phoneticRulesData as unknown as {
    blocked_syllables?: {
        first_position?: { block_all?: string[]; block_with_exceptions?: Record<string, { allowed_second?: string[]; blocked_second?: string[] }> };
        second_position?: { block_all?: string[]; block_with_exceptions?: Record<string, { allowed_first?: string[]; blocked_first?: string[] }> };
        specific_pairs?: { pairs?: [string, string][] };
        jongseong_rules?: Record<string, string[]>;
    };
    phonetic_patterns?: {
        soft_consonants?: string[];
        allowed_jong_with_ah?: string[];
        difficult_jongseong?: string[];
    };
};

// ============================================
// Global Risk 체크
// ============================================

/**
 * Global Risk 체크
 * @param romanName - 로마자 이름
 * @returns isCritical: true면 차단, warning 객체 또는 null
 */
export function checkGlobalRisk(romanName: string): { isCritical: boolean; warning: { reason: string; alternative: string } | null } {
    const upperName = romanName.toUpperCase();

    for (const risk of globalRisk) {
        if (upperName.includes(risk.bad_word.toUpperCase())) {
            if (risk.severity === 'critical') {
                return { isCritical: true, warning: null };
            } else {
                return {
                    isCritical: false,
                    warning: { reason: risk.reason || '', alternative: risk.alternative || '' }
                };
            }
        }
    }

    return { isCritical: false, warning: null };
}

// ============================================
// Bad Combinations 체크
// ============================================

/**
 * Bad Combinations 체크 (이름 2글자 + Full Name)
 * @param surname - 성씨 한글
 * @param firstName - 이름 2글자 한글
 * @returns true면 탈락
 */
export function checkBadCombinations(surname: string, firstName: string): boolean {
    const fullName = surname + firstName;

    for (const bad of badCombinations) {
        if (firstName === bad.word) return true;
        if (fullName.includes(bad.word)) return true;
    }

    return false;
}

// ============================================
// 성씨-이름 발음 흐름 체크
// ============================================

/**
 * 성씨-이름 첫글자 발음 흐름 체크
 * "정 + 성예" 처럼 성씨 종성 후 첫글자에 받침 있으면 어색
 * @returns 페널티 점수 (음수)
 */
export function checkSurnameNameFlow(surname: string, hangul1: string): number {
    const dSurname = decomposeHangul(surname);
    const d1 = decomposeHangul(hangul1);

    if (!dSurname || !d1) return 0;

    let penalty = 0;

    // 성씨가 받침으로 끝나는 경우 (정, 강, 김, 박, 한 등)
    // 첫글자도 받침으로 끝나면 발음이 무거워짐
    if (dSurname.jong && d1.jong) {
        penalty -= 3;
    }

    // ㅇ 받침(성씨) + ㅅ/ㅈ 초성(이름) = 가벼운 페널티만
    if (dSurname.jong === 'ㅇ' && ['ㅅ', 'ㅈ', 'ㅊ', 'ㅆ'].includes(d1.cho)) {
        if (d1.jong) {
            penalty -= 4;
        }
    }

    // 같은 초성 반복 (정 + 정, 김 + 기 등)
    if (dSurname.cho === d1.cho && dSurname.cho !== 'ㅇ') {
        penalty -= 5;
    }

    return penalty;
}

// ============================================
// 분파(分派) 한자 체크
// ============================================

/**
 * 분파(分派) 한자 체크
 * 가로/세로로 갈라지는 한자 필터링
 * @returns 분파 심각도 또는 null
 */
export function checkBunpaCharacter(hanja: string): BunpaSeverity {
    if (bunpaData.severity.strong_bunpa.includes(hanja)) return 'strong';
    if (bunpaData.severity.medium_bunpa.includes(hanja)) return 'medium';
    if (bunpaData.severity.mild_bunpa.includes(hanja)) return 'mild';
    return null;
}

/**
 * 분파 점수 계산
 */
export function calculateBunpaScore(hanja1: { hanja: string }, hanja2: { hanja: string }): number {
    let penalty = 0;

    const bunpa1 = checkBunpaCharacter(hanja1.hanja);
    const bunpa2 = checkBunpaCharacter(hanja2.hanja);

    if (bunpa1 === 'strong') penalty -= 25;
    else if (bunpa1 === 'medium') penalty -= 15;
    else if (bunpa1 === 'mild') penalty -= 5;

    if (bunpa2 === 'strong') penalty -= 25;
    else if (bunpa2 === 'medium') penalty -= 15;
    else if (bunpa2 === 'mild') penalty -= 5;

    return penalty;
}

// ============================================
// 동음이의어 리스크 체크
// ============================================

/**
 * 동음이의어 리스크 체크 (개선된 버전)
 */
export function checkHomophoneRisks(hangulName: string): RiskResult[] {
    const risks: RiskResult[] = [];

    for (const homo of homophoneRisks) {
        if (hangulName.includes(homo.word)) {
            risks.push({
                type: 'homophone',
                word: homo.word,
                reason: homo.reason,
                severity: homo.severity || 'warning',
                category: homo.category
            });
        }
    }

    const modernData = modernPreferences as { homophone_words?: Record<string, { syllables?: string[]; severity?: string }> };
    if (modernData.homophone_words) {
        for (const [word, data] of Object.entries(modernData.homophone_words)) {
            if (hangulName === word || (data.syllables && data.syllables.includes(hangulName))) {
                risks.push({
                    type


                        : 'homophone',
                    word: word,
                    severity: data.severity,
                    reason: `'${word}'와(과) 동음이의어`
                });
            }
        }
    }

    return risks;
}

// ============================================
// 일반 단어 충돌 체크
// ============================================

/**
 * Tier 2: 일반 단어 충돌 체크
 * 예: 예수, 지도, 예민, 방법 등 일상어와 겹치는 이름 차단/페널티
 */
export function checkCommonWordConflict(hangulName: string): RiskResult[] {
    const conflicts: RiskResult[] = [];

    for (const entry of commonWords.common_words) {
        if (hangulName === entry.word) {
            conflicts.push({
                type: 'common_word',
                word: entry.word,
                category: entry.category,
                severity: entry.severity,
                reason: entry.reason
            });
        }
    }

    return conflicts;
}

// ============================================
// 발음 관련 Helper
// ============================================

/**
 * 같은 모음 계열인지 확인
 */
export function isSameVowelFamily(vowel1: string, vowel2: string): boolean {
    const families = [
        ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ'],
        ['ㅓ', 'ㅔ', 'ㅕ', 'ㅖ'],
        ['ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ'],
        ['ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ']
    ];
    return families.some(family => family.includes(vowel1) && family.includes(vowel2));
}

// ============================================
// 어색한 발음 체크
// ============================================

/**
 * 음운 규칙 기반 어색한 발음 체크 (데이터 기반 리팩토링)
 * 모든 규칙은 phonetic_rules.json의 blocked_syllables, phonetic_patterns에서 로드
 */
export function hasAwkwardPhonetics(hangul1: string, hangul2: string): boolean {
    const d1 = decomposeHangul(hangul1);
    const d2 = decomposeHangul(hangul2);
    if (!d1 || !d2) return false;

    const blocked = phoneticRules.blocked_syllables || {};
    const patterns = phoneticRules.phonetic_patterns || {};

    // 1. 첫째 글자 위치 차단 체크
    if (blocked.first_position) {
        if (blocked.first_position.block_all?.includes(hangul1)) return true;
        const firstExceptions = blocked.first_position.block_with_exceptions?.[hangul1];
        if (firstExceptions) {
            if (firstExceptions.allowed_second && !firstExceptions.allowed_second.includes(hangul2)) return true;
            if (firstExceptions.blocked_second?.includes(hangul2)) return true;
        }
    }

    // 2. 둘째 글자 위치 차단 체크
    if (blocked.second_position) {
        if (blocked.second_position.block_all?.includes(hangul2)) return true;
        const secondExceptions = blocked.second_position.block_with_exceptions?.[hangul2];
        if (secondExceptions) {
            if (secondExceptions.allowed_first && !secondExceptions.allowed_first.includes(hangul1)) return true;
            if (secondExceptions.blocked_first?.includes(hangul1)) return true;
        }
    }

    // 3. 특정 첫째+둘째 조합 차단
    if (blocked.specific_pairs?.pairs) {
        for (const [first, second] of blocked.specific_pairs.pairs) {
            if (hangul1 === first && hangul2 === second) return true;
        }
    }

    // 4. 받침 기반 차단 규칙
    if (blocked.jongseong_rules) {
        if (hangul2 === '혜' && blocked.jongseong_rules['혜_with_jong']?.includes(d1.jong)) return true;
        if (hangul2 === '성' && blocked.jongseong_rules['성_with_jong']?.includes(d1.jong)) return true;
    }

    // 5. 발음 패턴 기반 차단
    const softConsonants = patterns.soft_consonants || ['ㄴ', 'ㅁ', 'ㄹ', 'ㅅ', 'ㅎ', 'ㅈ'];
    if (d1.cho === d2.cho && d1.cho !== 'ㅇ' && !softConsonants.includes(d1.cho)) return true;

    // ㄴ/ㄹ 관련 패턴 차단
    if ((d1.jong === 'ㄴ' && d2.cho === 'ㄹ') ||
        (d1.jong === 'ㄹ' && d2.cho === 'ㄴ') ||
        (d1.jong === 'ㄴ' && d2.jong === 'ㄴ')) return true;

    // ㅇ받침 + ㅇ초성 연음 패턴 차단
    if (d1.jong === 'ㅇ' && d2.cho === 'ㅇ') return true;

    // ㅇ초성/ㅇ받침/ㄴ받침 + ㄹ초성 패턴 차단
    if (d2.cho === 'ㄹ') {
        if (d1.jong === 'ㅇ' || d1.jong === 'ㄴ') return true;
        if (!d1.jong && d1.cho === 'ㅇ') return true;
    }

    // 받침 + ㅇ초성의 아/어 모음 차단
    const allowedJong = patterns.allowed_jong_with_ah || ['ㅁ', 'ㄴ'];
    if (d1.jong && d2.cho === 'ㅇ' && ['ㅏ', 'ㅓ'].includes(d2.jung)) {
        if (!allowedJong.includes(d1.jong)) return true;
    }

    // 발음 어려운 복합 종성
    const difficultJong = patterns.difficult_jongseong || [];
    if (difficultJong.includes(d1.jong) || difficultJong.includes(d2.jong)) return true;

    // ㅜ + ㅣ 조합
    if (d1.jung === 'ㅜ' && d2.jung === 'ㅣ') return true;

    return false;
}

// ============================================
// 격음 하드 블록 체크
// ============================================

/**
 * 격음(ㅋ,ㅌ,ㅍ,ㅊ) 하드 블록 체크
 * 평유, 유평, 자칠 등 어색한 격음 조합 차단
 */
export function hasAsperatedConsonantBlock(hangul1: string, hangul2: string): boolean {
    const d1 = decomposeHangul(hangul1);
    const d2 = decomposeHangul(hangul2);

    if (!d1 || !d2) return false;

    const aspiratedConsonants = ['ㅋ', 'ㅌ', 'ㅍ', 'ㅊ'];
    const popularFirst = ['태', '찬', '채', '철', '천', '탁'];
    const popularSecond = ['찬', '철', '태', '탁', '채', '천'];

    // 둘째 글자 격음 = 완전 차단 (유평, 민칠 등)
    if (aspiratedConsonants.includes(d2.cho) && !popularSecond.includes(hangul2)) {
        return true;
    }

    // 첫째 글자 격음 + 인기 예외 아닌 경우 = 차단 (평유, 칠성 등)
    if (aspiratedConsonants.includes(d1.cho) && !popularFirst.includes(hangul1)) {
        return true;
    }

    return false;
}
