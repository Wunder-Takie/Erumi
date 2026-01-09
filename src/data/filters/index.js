/**
 * 필터 통합 모듈
 * 3계층 필터링 시스템: HARD → SOFT → WARNING
 */

import blockedNames from './blocked_names.json' with { type: 'json' };
import oldFashioned from './old_fashioned.json' with { type: 'json' };
import phoneticPatterns from './phonetic_patterns.json' with { type: 'json' };

// ============================================
// 필터 계층 정의
// ============================================
export const FILTER_LAYERS = {
    HARD: 'HARD',       // 완전 차단
    SOFT: 'SOFT',       // 강한 페널티 (-30~-50)
    WARNING: 'WARNING'  // 약한 페널티 (-10~-20)
};

// ============================================
// HARD Layer: 완전 차단 목록
// ============================================
const hardBlockSet = new Set(blockedNames.flat_list);

export function isHardBlocked(name) {
    return hardBlockSet.has(name);
}

// ============================================
// SOFT Layer: 올드한 이름 (강한 페널티)
// ============================================
const softBlockSet = new Set(oldFashioned.flat_list);
const SOFT_PENALTY = oldFashioned.penalty || -30;

export function isSoftBlocked(name) {
    return softBlockSet.has(name);
}

export function getSoftPenalty(name) {
    return softBlockSet.has(name) ? SOFT_PENALTY : 0;
}

// ============================================
// 음절 패턴 필터링
// ============================================
const firstSyllableBlocks = phoneticPatterns.syllable_patterns.first_syllable_blocks.patterns;
const secondSyllableBlocks = phoneticPatterns.syllable_patterns.second_syllable_blocks.patterns;

export function checkSyllablePattern(hangul1, hangul2) {
    // 첫 글자 패턴 체크
    const firstPattern = firstSyllableBlocks[hangul1];
    if (firstPattern) {
        if (firstPattern.block_all) {
            return { blocked: true, layer: FILTER_LAYERS.HARD, reason: firstPattern.reason };
        }
        if (firstPattern.allowed && !firstPattern.allowed.includes(hangul2)) {
            return { blocked: true, layer: FILTER_LAYERS.HARD, reason: firstPattern.reason };
        }
    }

    // 둘째 글자 패턴 체크
    const secondPattern = secondSyllableBlocks[hangul2];
    if (secondPattern) {
        if (secondPattern.block_all) {
            return { blocked: true, layer: FILTER_LAYERS.HARD, reason: secondPattern.reason };
        }
        if (secondPattern.allowed && !secondPattern.allowed.includes(hangul1)) {
            return { blocked: true, layer: FILTER_LAYERS.HARD, reason: secondPattern.reason };
        }
    }

    return { blocked: false };
}

// ============================================
// 특정 조합 필터링
// ============================================
const specificBlocks = new Map(
    phoneticPatterns.specific_combinations.blocks.map(b => [`${b.first}${b.second}`, b.reason])
);

export function checkSpecificCombination(hangul1, hangul2) {
    const key = `${hangul1}${hangul2}`;
    if (specificBlocks.has(key)) {
        return { blocked: true, layer: FILTER_LAYERS.HARD, reason: specificBlocks.get(key) };
    }
    return { blocked: false };
}

// ============================================
// 발음 어려운 조합 체크
// ============================================
const difficultPronunciations = new Map(
    phoneticPatterns.phonetic_rules.difficult_pronunciation.map(d =>
        [`${d.first}${d.second}`, d.reason]
    )
);

export function checkDifficultPronunciation(hangul1, hangul2) {
    const key = `${hangul1}${hangul2}`;
    if (difficultPronunciations.has(key)) {
        return { penalty: -25, layer: FILTER_LAYERS.WARNING, reason: difficultPronunciations.get(key) };
    }
    return { penalty: 0 };
}

// ============================================
// 종합 필터 체크 (테스트 모드용)
// ============================================

// 🆕 한글 분해 함수
const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

function decomposeHangul(char) {
    const code = char.charCodeAt(0) - 0xAC00;
    if (code < 0 || code > 11171) return null;
    return {
        cho: CHO[Math.floor(code / 588)],
        jong: JONG[code % 28]
    };
}

// 🆕 경음화 체크
const fortitionRules = phoneticPatterns.korean_phonology?.fortition;
export function checkFortition(hangul1, hangul2) {
    if (!fortitionRules) return { penalty: 0 };

    const d1 = decomposeHangul(hangul1);
    const d2 = decomposeHangul(hangul2);
    if (!d1 || !d2) return { penalty: 0 };

    if (fortitionRules.trigger_jongseong.includes(d1.jong) &&
        fortitionRules.affected_choseong.includes(d2.cho)) {
        return {
            penalty: fortitionRules.penalty,
            layer: FILTER_LAYERS.WARNING,
            reason: fortitionRules.reason
        };
    }
    return { penalty: 0 };
}

// 🆕 비음화 체크
const nasalizationRules = phoneticPatterns.korean_phonology?.nasalization?.rules || [];
export function checkNasalization(hangul1, hangul2) {
    const d1 = decomposeHangul(hangul1);
    const d2 = decomposeHangul(hangul2);
    if (!d1 || !d2) return { penalty: 0 };

    for (const rule of nasalizationRules) {
        if (d1.jong === rule.jong && d2.cho === rule.cho) {
            return {
                penalty: rule.penalty,
                layer: FILTER_LAYERS.WARNING,
                reason: `비음화: ${hangul1}${hangul2} → ${rule.result}`
            };
        }
    }
    return { penalty: 0 };
}

// 🆕 유사 발음 탐지
const similarSoundPatterns = phoneticPatterns.similar_sound_detection?.patterns || [];
const similarSoundSet = new Set();
similarSoundPatterns.forEach(p => {
    similarSoundSet.add(p.blocked);
    p.similar.forEach(s => similarSoundSet.add(s));
});

export function checkSimilarSound(name) {
    if (similarSoundSet.has(name)) {
        return { blocked: true, layer: FILTER_LAYERS.HARD, reason: '비속어 유사 발음' };
    }
    return { blocked: false };
}

export function filterDiagnose(name) {
    const hangul1 = name.charAt(0);
    const hangul2 = name.charAt(1);
    const results = [];

    // HARD Layer 체크
    if (isHardBlocked(name)) {
        results.push({ layer: FILTER_LAYERS.HARD, type: 'blocked_list', reason: '차단 목록에 포함' });
    }

    const syllableCheck = checkSyllablePattern(hangul1, hangul2);
    if (syllableCheck.blocked) {
        results.push({ layer: FILTER_LAYERS.HARD, type: 'syllable_pattern', reason: syllableCheck.reason });
    }

    const specificCheck = checkSpecificCombination(hangul1, hangul2);
    if (specificCheck.blocked) {
        results.push({ layer: FILTER_LAYERS.HARD, type: 'specific_combination', reason: specificCheck.reason });
    }

    const similarCheck = checkSimilarSound(name);
    if (similarCheck.blocked) {
        results.push({ layer: FILTER_LAYERS.HARD, type: 'similar_sound', reason: similarCheck.reason });
    }

    // SOFT Layer 체크
    if (isSoftBlocked(name)) {
        results.push({ layer: FILTER_LAYERS.SOFT, type: 'old_fashioned', reason: '올드한 이름', penalty: SOFT_PENALTY });
    }

    // WARNING Layer 체크
    const difficultCheck = checkDifficultPronunciation(hangul1, hangul2);
    if (difficultCheck.penalty !== 0) {
        results.push({ layer: FILTER_LAYERS.WARNING, type: 'difficult_pronunciation', reason: difficultCheck.reason, penalty: difficultCheck.penalty });
    }

    const fortitionCheck = checkFortition(hangul1, hangul2);
    if (fortitionCheck.penalty !== 0) {
        results.push({ layer: FILTER_LAYERS.WARNING, type: 'fortition', reason: fortitionCheck.reason, penalty: fortitionCheck.penalty });
    }

    const nasalizationCheck = checkNasalization(hangul1, hangul2);
    if (nasalizationCheck.penalty !== 0) {
        results.push({ layer: FILTER_LAYERS.WARNING, type: 'nasalization', reason: nasalizationCheck.reason, penalty: nasalizationCheck.penalty });
    }

    return {
        name,
        isBlocked: results.some(r => r.layer === FILTER_LAYERS.HARD),
        totalPenalty: results.reduce((sum, r) => sum + (r.penalty || 0), 0),
        filters: results
    };
}

// ============================================
// 기존 코드와의 호환성 유지
// ============================================
export function isInCriticalBlocks(name) {
    return isHardBlocked(name);
}

export default {
    FILTER_LAYERS,
    isHardBlocked,
    isSoftBlocked,
    getSoftPenalty,
    checkSyllablePattern,
    checkSpecificCombination,
    checkDifficultPronunciation,
    checkFortition,
    checkNasalization,
    checkSimilarSound,
    filterDiagnose,
    isInCriticalBlocks,
    // Raw data exports
    blockedNames,
    oldFashioned,
    phoneticPatterns
};
