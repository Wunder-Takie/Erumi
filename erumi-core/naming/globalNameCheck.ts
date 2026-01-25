/**
 * globalNameCheck.ts
 * Global Name Check Utility
 * Checks Korean names for:
 * 1. Problematic English pronunciations
 * 2. Negative meanings in other languages
 * 3. Phonetic compatibility issues
 */

// ==========================================
// Types
// ==========================================

interface NegativeSoundPattern {
    pattern: RegExp;
    reason: string;
}

interface DecomposedHangul {
    initial: string;
    medial: string;
    final: string;
}

interface PronunciationWarning {
    type: 'pronunciation';
    severity: 'warning';
    romanized: string;
    reason: string;
}

interface ComplexityWarning {
    type: 'complexity';
    severity: 'info';
    reason: string;
}

type NameWarning = PronunciationWarning | ComplexityWarning;

export interface GlobalCheckResult {
    romanized: string;
    hasWarning: boolean;
    warnings: NameWarning[];
    primaryWarning: NameWarning | null;
}

export interface FormattedWarning {
    reason: string;
    romanized: string;
    severity: 'warning' | 'info';
}

// ==========================================
// Constants
// ==========================================

const NEGATIVE_SOUND_PATTERNS: NegativeSoundPattern[] = [
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

const ROMANIZATION_MAP: Record<string, string> = {
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

// ==========================================
// Internal Functions
// ==========================================

function decomposeHangul(char: string): DecomposedHangul | null {
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

function generateRomanizationVariants(korean: string): string[] {
    const base = romanize(korean);
    const variants = [base];

    variants.push(base.replace(/eo/g, 'o').replace(/eu/g, 'u'));
    variants.push(base.replace(/ae/g, 'e'));
    variants.push(base.replace(/wo/g, 'o'));

    return [...new Set(variants)];
}

// ==========================================
// Exported Functions
// ==========================================

export function romanize(korean: string): string {
    let result = '';

    for (let i = 0; i < korean.length; i++) {
        const char = korean[i];
        const decomposed = decomposeHangul(char);

        if (decomposed) {
            result += ROMANIZATION_MAP[decomposed.initial] || '';
            result += ROMANIZATION_MAP[decomposed.medial] || '';
            if (decomposed.final) {
                result += ROMANIZATION_MAP[decomposed.final + '_f'] || '';
            }
        } else {
            result += char;
        }
    }

    return result.toLowerCase();
}

export function checkEnglishPronunciation(koreanName: string): PronunciationWarning[] {
    const warnings: PronunciationWarning[] = [];
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
                break;
            }
        }
    }

    return warnings;
}

export function checkPhoneticComplexity(koreanName: string): ComplexityWarning[] {
    const romanized = romanize(koreanName);
    const warnings: ComplexityWarning[] = [];

    if (/[bcdfghjklmnpqrstvwxyz]{4,}/i.test(romanized)) {
        warnings.push({
            type: 'complexity',
            severity: 'info',
            reason: '영어권에서 발음하기 어려운 자음 조합'
        });
    }

    if (/ng[gk]/i.test(romanized)) {
        warnings.push({
            type: 'complexity',
            severity: 'info',
            reason: 'ng + g/k 조합은 외국인에게 발음이 어려움'
        });
    }

    return warnings;
}

export function checkGlobalName(koreanName: string): GlobalCheckResult {
    const romanized = romanize(koreanName);
    const pronunciationWarnings = checkEnglishPronunciation(koreanName);
    const complexityWarnings = checkPhoneticComplexity(koreanName);

    const allWarnings: NameWarning[] = [...pronunciationWarnings, ...complexityWarnings];

    return {
        romanized,
        hasWarning: allWarnings.length > 0,
        warnings: allWarnings,
        primaryWarning: allWarnings.length > 0 ? allWarnings[0] : null
    };
}

export function formatGlobalWarning(globalCheck: GlobalCheckResult): FormattedWarning | null {
    if (!globalCheck.hasWarning || !globalCheck.primaryWarning) return null;

    return {
        reason: globalCheck.primaryWarning.reason,
        romanized: globalCheck.romanized,
        severity: globalCheck.primaryWarning.severity
    };
}
