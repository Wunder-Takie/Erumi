/**
 * filters.js
 * 필터링 및 검증 로직
 */

import { decomposeHangul, getInitialSound } from './helpers.js';
import { ROUND_VOWELS } from './constants.js';
import globalRisk from '../../data/global_risk.json' with { type: 'json' };
import badCombinations from '../../data/bad_combinations.json' with { type: 'json' };
import homophoneRisks from '../../data/homophone_risks.json' with { type: 'json' };
import modernPreferences from '../../data/modern_preferences.json' with { type: 'json' };
import commonWords from '../../data/common_words.json' with { type: 'json' };

/**
 * Global Risk 체크
 * @param {string} romanName - 로마자 이름
 * @returns {{ isCritical: boolean, warning: object | null }}
 */
export function checkGlobalRisk(romanName) {
    const upperName = romanName.toUpperCase();

    for (const risk of globalRisk) {
        if (upperName.includes(risk.bad_word.toUpperCase())) {
            if (risk.severity === 'critical') {
                return { isCritical: true, warning: null };
            } else {
                return {
                    isCritical: false,
                    warning: { reason: risk.reason, alternative: risk.alternative }
                };
            }
        }
    }

    return { isCritical: false, warning: null };
}

/**
 * Bad Combinations 체크 (이름 2글자 + Full Name)
 * @param {string} surname - 성씨 한글
 * @param {string} firstName - 이름 2글자 한글
 * @returns {boolean} - true면 탈락
 */
export function checkBadCombinations(surname, firstName) {
    const fullName = surname + firstName;

    for (const bad of badCombinations) {
        if (firstName === bad.word) return true;
        if (fullName.includes(bad.word)) return true;
    }

    return false;
}

/**
 * 발음 필터링 - 초성 반복 체크
 * @returns {boolean} - true면 탈락
 */
export function hasChoSeongRepetition(surname, char1, char2) {
    const decomposedSurname = decomposeHangul(surname);
    const decomposed1 = decomposeHangul(char1);
    const decomposed2 = decomposeHangul(char2);

    if (!decomposedSurname || !decomposed1 || !decomposed2) return false;

    const cho0 = decomposedSurname.cho;
    const cho1 = decomposed1.cho;
    const cho2 = decomposed2.cho;

    if (cho1 === 'ㅇ' && cho2 === 'ㅇ') return false;
    if (cho1 === cho2 && cho1 !== 'ㅇ') return true;
    if (cho0 === cho1 && cho1 === cho2) return true;

    return false;
}

/**
 * 발음 필터링 - 원순모음 충돌 체크
 */
export function hasRoundVowelConflict(char1, char2) {
    const decomposed1 = decomposeHangul(char1);
    const decomposed2 = decomposeHangul(char2);

    if (!decomposed1 || !decomposed2) return false;

    const isRound1 = ROUND_VOWELS.includes(decomposed1.jung);
    const isRound2 = ROUND_VOWELS.includes(decomposed2.jung);

    return isRound1 && isRound2;
}

/**
 * 발음 필터링 - 종성-초성 충돌 (ㄴ-ㄹ / ㄹ-ㄴ)
 */
export function hasJongChoConflict(char1, char2) {
    const decomposed1 = decomposeHangul(char1);
    const decomposed2 = decomposeHangul(char2);

    if (!decomposed1 || !decomposed2) return false;

    const jong1 = decomposed1.jong;
    const cho2 = decomposed2.cho;

    if (jong1 === 'ㄴ' && cho2 === 'ㄹ') return true;
    if (jong1 === 'ㄹ' && cho2 === 'ㄴ') return true;

    return false;
}

/**
 * 동음이의어 리스크 체크 (개선된 버전)
 */
export function checkHomophoneRisks(hangulName) {
    const risks = [];

    // 기존 homophoneRisks (legacy)
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

    // 🆕 modernPreferences 기반 동음이의어 체크
    if (modernPreferences.homophone_words) {
        for (const [word, data] of Object.entries(modernPreferences.homophone_words)) {
            if (hangulName === word || (data.syllables && data.syllables.includes(hangulName))) {
                risks.push({
                    type: 'homophone',
                    word: word,
                    severity: data.severity,
                    reason: `'${word}'와(과) 동음이의어`
                });
            }
        }
    }

    return risks;
}

/**
 * 🆕 Tier 2: 일반 단어 충돌 체크
 * 예: 예수, 지도, 예민, 방법 등 일상어와 겹치는 이름 차단/페널티
 */
export function checkCommonWordConflict(hangulName) {
    const conflicts = [];

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
