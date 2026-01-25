/**
 * hangulUtils.ts
 * 한글 음절 분해 및 처리 유틸리티
 */

// ============================================
// Types
// ============================================

export interface DecomposedHangul {
    cho: string;   // 초성
    jung: string;  // 중성
    jong: string;  // 종성 (받침 없으면 빈 문자열)
}

// ============================================
// Constants
// ============================================

// 초성 리스트 (19개)
export const CHO_SEONG: readonly string[] = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
    'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
] as const;

// 중성 리스트 (21개)
export const JUNG_SEONG: readonly string[] = [
    'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
    'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
] as const;

// 종성 리스트 (28개, 첫 번째는 받침 없음)
export const JONG_SEONG: readonly string[] = [
    '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
    'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
    'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
] as const;

// 원순모음 (ㅗ, ㅜ, ㅛ, ㅠ 계열)
export const ROUND_VOWELS: readonly string[] = [
    'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ'
] as const;

// ============================================
// Functions
// ============================================

/**
 * 한글 음절을 초성/중성/종성으로 분해
 * @param char - 한글 한 글자
 * @returns 분해된 한글 정보 또는 null (한글 아닐 경우)
 */
export function decomposeHangul(char: string): DecomposedHangul | null {
    if (!char || char.length !== 1) return null;

    const code = char.charCodeAt(0);

    // 한글 음절 범위: 0xAC00 ~ 0xD7A3
    if (code < 0xAC00 || code > 0xD7A3) return null;

    const offset = code - 0xAC00;
    const choIndex = Math.floor(offset / (21 * 28));
    const jungIndex = Math.floor((offset % (21 * 28)) / 28);
    const jongIndex = offset % 28;

    return {
        cho: CHO_SEONG[choIndex],
        jung: JUNG_SEONG[jungIndex],
        jong: JONG_SEONG[jongIndex]
    };
}

/**
 * 한글 글자의 초성을 반환
 * @param char - 한글 문자열 (첫 글자만 사용)
 * @returns 초성 문자 또는 빈 문자열
 */
export function getInitialSound(char: string): string {
    if (!char) return '';
    const targetChar = char.charAt(0);
    const decomposed = decomposeHangul(targetChar);
    return decomposed ? decomposed.cho : '';
}

/**
 * 문자가 한글인지 확인
 * @param char - 확인할 문자
 * @returns 한글이면 true
 */
export function isHangul(char: string): boolean {
    if (!char || char.length !== 1) return false;
    const code = char.charCodeAt(0);
    return code >= 0xAC00 && code <= 0xD7A3;
}

/**
 * 원순모음인지 확인
 * @param vowel - 모음 문자
 * @returns 원순모음이면 true
 */
export function isRoundVowel(vowel: string): boolean {
    return ROUND_VOWELS.includes(vowel);
}
