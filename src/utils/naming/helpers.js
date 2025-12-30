/**
 * helpers.js
 * 유틸리티 함수 - 한글 분해, 데이터 조회 등
 */

import { CHO_SEONG, JUNG_SEONG, JONG_SEONG } from './constants.js';
import suri81 from '../../data/suri_81.json' with { type: 'json' };
import surnames from '../../data/surnames.json' with { type: 'json' };

/**
 * 한글 음절을 초성/중성/종성으로 분해
 * @param {string} char - 한글 한 글자
 * @returns {{ cho: string, jung: string, jong: string } | null}
 */
export function decomposeHangul(char) {
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
 * @param {string} char 
 * @returns {string}
 */
export function getInitialSound(char) {
    if (!char) return '';
    const targetChar = char.charAt(0);
    const decomposed = decomposeHangul(targetChar);
    return decomposed ? decomposed.cho : '';
}

/**
 * 81수리 리스트에서 해당 숫자가 길(Lucky)인지 확인
 * @param {number} count - 획수 합계
 * @returns {boolean}
 */
export function isLuckySuri(count) {
    const normalizedCount = count > 81 ? (count % 81 || 81) : count;
    return suri81.some(s => s.count === normalizedCount);
}

/**
 * 81수리 정보 가져오기
 * @param {number} count - 획수 합계
 * @returns {object | null}
 */
export function getSuriInfo(count) {
    const normalizedCount = count > 81 ? (count % 81 || 81) : count;
    return suri81.find(s => s.count === normalizedCount) || null;
}

/**
 * 성씨 정보 가져오기
 * @param {string} hangul - 성씨 한글
 * @returns {object | null}
 */
export function getSurnameInfo(hangul) {
    return surnames.find(s => s.hangul === hangul) || null;
}

/**
 * 같은 모음 계열인지 확인
 * @param {string} vowel1 
 * @param {string} vowel2 
 * @returns {boolean}
 */
export function isSameVowelFamily(vowel1, vowel2) {
    const families = [
        ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ'],
        ['ㅓ', 'ㅔ', 'ㅕ', 'ㅖ'],
        ['ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ'],
        ['ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ'],
        ['ㅡ', 'ㅢ'],
        ['ㅣ']
    ];

    for (const family of families) {
        if (family.includes(vowel1) && family.includes(vowel2)) {
            return true;
        }
    }
    return false;
}
