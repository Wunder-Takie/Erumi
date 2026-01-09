/**
 * Global Name Check Utility
 * Checks Korean names for:
 * 1. Problematic English pronunciations
 * 2. Negative meanings in other languages
 * 3. Phonetic compatibility issues
 */

// 영어권에서 부정적 의미가 있는 발음 패턴
const NEGATIVE_SOUND_PATTERNS = [
    { pattern: /die/i, reason: '영어 "die"(죽다)와 유사한 발음' },
    { pattern: /kill/i, reason: '영어 "kill"(죽이다)와 유사한 발음' },
    { pattern: /dead/i, reason: '영어 "dead"(죽은)와 유사한 발음' },
    { pattern: /sick/i, reason: '영어 "sick"(아픈)과 유사한 발음' },
    { pattern: /sin/i, reason: '영어 "sin"(죄)과 유사한 발음' },
    { pattern: /fat/i, reason: '영어 "fat"(뚱뚱한)과 유사한 발음' },
    { pattern: /dumb/i, reason: '영어 "dumb"(바보)와 유사한 발음' },
    { pattern: /hell/i, reason: '영어 "hell"(지옥)과 유사한 발음' },
    { pattern: /hate/i, reason: '영어 "hate"(증오)와 유사한 발음' },
    { pattern: /poo/i, reason: '영어 "poo"(똥)와 유사한 발음' },
    { pattern: /bum/i, reason: '영어 "bum"(부랑자)과 유사한 발음' },
    { pattern: /butt/i, reason: '영어 "butt"(엉덩이)와 유사한 발음' }
];

// 한글 → 로마자 변환 (Revised Romanization)
const ROMANIZATION_MAP = {
    // 초성
    'ㄱ': 'g', 'ㄲ': 'kk', 'ㄴ': 'n', 'ㄷ': 'd', 'ㄸ': 'tt',
    'ㄹ': 'r', 'ㅁ': 'm', 'ㅂ': 'b', 'ㅃ': 'pp', 'ㅅ': 's',
    'ㅆ': 'ss', 'ㅇ': '', 'ㅈ': 'j', 'ㅉ': 'jj', 'ㅊ': 'ch',
    'ㅋ': 'k', 'ㅌ': 't', 'ㅍ': 'p', 'ㅎ': 'h',
    // 중성
    'ㅏ': 'a', 'ㅐ': 'ae', 'ㅑ': 'ya', 'ㅒ': 'yae', 'ㅓ': 'eo',
    'ㅔ': 'e', 'ㅕ': 'yeo', 'ㅖ': 'ye', 'ㅗ': 'o', 'ㅘ': 'wa',
    'ㅙ': 'wae', 'ㅚ': 'oe', 'ㅛ': 'yo', 'ㅜ': 'u', 'ㅝ': 'wo',
    'ㅞ': 'we', 'ㅟ': 'wi', 'ㅠ': 'yu', 'ㅡ': 'eu', 'ㅢ': 'ui', 'ㅣ': 'i',
    // 종성
    'ㄱ_f': 'k', 'ㄲ_f': 'k', 'ㄳ_f': 'k', 'ㄴ_f': 'n', 'ㄵ_f': 'n',
    'ㄶ_f': 'n', 'ㄷ_f': 't', 'ㄹ_f': 'l', 'ㄺ_f': 'k', 'ㄻ_f': 'm',
    'ㄼ_f': 'l', 'ㄽ_f': 'l', 'ㄾ_f': 'l', 'ㄿ_f': 'p', 'ㅀ_f': 'l',
    'ㅁ_f': 'm', 'ㅂ_f': 'p', 'ㅄ_f': 'p', 'ㅅ_f': 't', 'ㅆ_f': 't',
    'ㅇ_f': 'ng', 'ㅈ_f': 't', 'ㅊ_f': 't', 'ㅋ_f': 'k', 'ㅌ_f': 't',
    'ㅍ_f': 'p', 'ㅎ_f': 't'
};

const INITIALS = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const MEDIALS = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
const FINALS = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

// 한글 음절 분해
function decomposeHangul(char) {
    const code = char.charCodeAt(0);
    if (code < 0xAC00 || code > 0xD7A3) return null;

    const offset = code - 0xAC00;
    const initialIndex = Math.floor(offset / (21 * 28));
    const medialIndex = Math.floor((offset % (21 * 28)) / 28);
    const finalIndex = offset % 28;

    return {
        initial: INITIALS[initialIndex],
        medial: MEDIALS[medialIndex],
        final: FINALS[finalIndex]
    };
}

// 한글 → 로마자 변환
export function romanize(korean) {
    let result = '';

    for (let i = 0; i < korean.length; i++) {
        const char = korean[i];
        const decomposed = decomposeHangul(char);

        if (decomposed) {
            // 초성
            result += ROMANIZATION_MAP[decomposed.initial] || '';
            // 중성
            result += ROMANIZATION_MAP[decomposed.medial] || '';
            // 종성 (있는 경우)
            if (decomposed.final) {
                result += ROMANIZATION_MAP[decomposed.final + '_f'] || '';
            }
        } else {
            result += char;
        }
    }

    return result.toLowerCase();
}

// 여러 로마자 표기 변형 생성
function generateRomanizationVariants(korean) {
    const base = romanize(korean);
    const variants = [base];

    // 일반적인 변형 추가
    // eo → o, eu → u 변형 (영어권에서 흔한 단순화)
    variants.push(base.replace(/eo/g, 'o').replace(/eu/g, 'u'));
    // ae → e 변형
    variants.push(base.replace(/ae/g, 'e'));
    // wo → o 변형
    variants.push(base.replace(/wo/g, 'o'));

    return [...new Set(variants)];
}

// 영어 발음 문제 검사
export function checkEnglishPronunciation(koreanName) {
    const warnings = [];
    const variants = generateRomanizationVariants(koreanName);

    for (const variant of variants) {
        for (const { pattern, reason } of NEGATIVE_SOUND_PATTERNS) {
            if (pattern.test(variant)) {
                warnings.push({
                    type: 'pronunciation',
                    severity: 'warning',
                    romanized: variant,
                    reason
                });
                break; // 한 변형에서 하나의 경고만
            }
        }
    }

    return warnings;
}

// 발음 가능성 검사 (자음 연속 등)
export function checkPhoneticComplexity(koreanName) {
    const romanized = romanize(koreanName);
    const warnings = [];

    // 3개 이상의 연속 자음
    if (/[bcdfghjklmnpqrstvwxyz]{4,}/i.test(romanized)) {
        warnings.push({
            type: 'complexity',
            severity: 'info',
            reason: '영어권에서 발음하기 어려운 자음 조합'
        });
    }

    // 특수 발음 조합 경고
    if (/ng[gk]/i.test(romanized)) {
        warnings.push({
            type: 'complexity',
            severity: 'info',
            reason: 'ng + g/k 조합은 외국인에게 발음이 어려움'
        });
    }

    return warnings;
}

// 종합 글로벌 이름 검사
export function checkGlobalName(koreanName) {
    const romanized = romanize(koreanName);
    const pronunciationWarnings = checkEnglishPronunciation(koreanName);
    const complexityWarnings = checkPhoneticComplexity(koreanName);

    const allWarnings = [...pronunciationWarnings, ...complexityWarnings];

    return {
        romanized,
        hasWarning: allWarnings.length > 0,
        warnings: allWarnings,
        // 가장 심각한 경고 추출
        primaryWarning: allWarnings.length > 0 ? allWarnings[0] : null
    };
}

// 이름 생성 시 사용할 경고 메시지 포맷
export function formatGlobalWarning(globalCheck) {
    if (!globalCheck.hasWarning) return null;

    return {
        reason: globalCheck.primaryWarning.reason,
        romanized: globalCheck.romanized,
        severity: globalCheck.primaryWarning.severity
    };
}
