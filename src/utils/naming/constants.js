/**
 * constants.js
 * 작명 시스템 상수 및 참조 데이터
 */

// 오행 상생 (生): A가 B를 생성/강화
export const ELEMENT_GENERATION = {
    'Wood': 'Fire',    // 木生火
    'Fire': 'Earth',   // 火生土
    'Earth': 'Metal',  // 土生金
    'Metal': 'Water',  // 金生水
    'Water': 'Wood'    // 水生木
};

// 오행 상극 (剋): A가 B를 약화/파괴
export const ELEMENT_DESTRUCTION = {
    'Wood': 'Earth',   // 木剋土
    'Fire': 'Metal',   // 火剋金
    'Earth': 'Water',  // 土剋水
    'Metal': 'Wood',   // 金剋木
    'Water': 'Fire'    // 水剋火
};

// 한글 초성 (19개)
export const CHO_SEONG = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
    'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

// 한글 중성 (21개)
export const JUNG_SEONG = [
    'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
    'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
];

// 한글 종성 (28개, 빈 종성 포함)
export const JONG_SEONG = [
    '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
    'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
    'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

// 원순모음 (ㅗ, ㅜ, ㅛ, ㅠ 계열)
export const ROUND_VOWELS = ['ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ'];
