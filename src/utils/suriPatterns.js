/**
 * suriPatterns.js
 * 수리 사전 필터 - 4격 길수 획수 조합 계산
 */

import suri81 from '../data/suri_81.json' with { type: 'json' };

// 길수 목록 추출
const LUCKY_NUMBERS = new Set(suri81.map(s => s.count));

/**
 * 해당 숫자가 길수인지 확인
 */
function isLucky(count) {
    const normalized = count > 81 ? (count % 81 || 81) : count;
    return LUCKY_NUMBERS.has(normalized);
}

/**
 * 4격 수리 계산
 * @param {number} surnameStrokes - 성씨 획수
 * @param {number} strokes1 - 첫째 글자 획수
 * @param {number} strokes2 - 둘째 글자 획수
 */
function calculate4Geok(surnameStrokes, strokes1, strokes2) {
    return {
        초년운: strokes1 + strokes2,           // 이름 두 글자
        중년운: surnameStrokes + strokes1,      // 성 + 첫째
        말년운: surnameStrokes + strokes2,      // 성 + 둘째
        총운: surnameStrokes + strokes1 + strokes2  // 전체
    };
}

/**
 * 4격 중 몇 개가 길수인지 계산
 */
function countLuckyGeok(surnameStrokes, strokes1, strokes2) {
    const geok = calculate4Geok(surnameStrokes, strokes1, strokes2);
    let count = 0;
    if (isLucky(geok.초년운)) count++;
    if (isLucky(geok.중년운)) count++;
    if (isLucky(geok.말년운)) count++;
    if (isLucky(geok.총운)) count++;
    return count;
}

/**
 * 4격 모두 길수인지 확인 (엄격한 모드)
 */
function isAll4Lucky(surnameStrokes, strokes1, strokes2) {
    return countLuckyGeok(surnameStrokes, strokes1, strokes2) === 4;
}

/**
 * 4격 중 3개 이상 길수인지 확인 (완화된 모드)
 * 🆕 결과 수 증가를 위해 3/4도 허용
 */
function isAtLeast3Lucky(surnameStrokes, strokes1, strokes2) {
    return countLuckyGeok(surnameStrokes, strokes1, strokes2) >= 3;
}

/**
 * 성씨 획수에 맞는 길수 조합 패턴 생성
 * 이름 한 글자당 1~25획 범위로 제한
 * 
 * @param {number} surnameStrokes - 성씨 획수
 * @returns {Array<{strokes1: number, strokes2: number}>} - 길수 조합 배열
 */
export function getLuckyStrokeCombinations(surnameStrokes) {
    const combinations = [];

    // 획수 범위: 1~25획 (실용적인 한자 범위)
    const MIN_STROKES = 1;
    const MAX_STROKES = 25;

    for (let s1 = MIN_STROKES; s1 <= MAX_STROKES; s1++) {
        for (let s2 = MIN_STROKES; s2 <= MAX_STROKES; s2++) {
            if (isAll4Lucky(surnameStrokes, s1, s2)) {
                combinations.push({ strokes1: s1, strokes2: s2 });
            }
        }
    }

    console.log(`📊 성씨 ${surnameStrokes}획: ${combinations.length}개 길수 조합 발견`);
    return combinations;
}

/**
 * 특정 획수 조합이 수리학적으로 양호한지 확인
 * 🆕 3/4 완화 모드: 4격 중 3개 이상 길수면 허용
 */
export function isLuckyCombination(surnameStrokes, strokes1, strokes2) {
    return isAtLeast3Lucky(surnameStrokes, strokes1, strokes2);
}

/**
 * 4격 정보 반환 (길흉 포함)
 */
export function get4GeokInfo(surnameStrokes, strokes1, strokes2) {
    const geok = calculate4Geok(surnameStrokes, strokes1, strokes2);
    return {
        초년운: { count: geok.초년운, lucky: isLucky(geok.초년운) },
        중년운: { count: geok.중년운, lucky: isLucky(geok.중년운) },
        말년운: { count: geok.말년운, lucky: isLucky(geok.말년운) },
        총운: { count: geok.총운, lucky: isLucky(geok.총운) },
        allLucky: isAll4Lucky(surnameStrokes, strokes1, strokes2)
    };
}

// 성씨별 길수 조합 캐시 (성능 최적화)
const CACHE = new Map();

/**
 * 캐시된 길수 조합 가져오기
 */
export function getLuckyStrokesWithCache(surnameStrokes) {
    if (!CACHE.has(surnameStrokes)) {
        CACHE.set(surnameStrokes, getLuckyStrokeCombinations(surnameStrokes));
    }
    return CACHE.get(surnameStrokes);
}

export default {
    getLuckyStrokeCombinations,
    getLuckyStrokesWithCache,
    isLuckyCombination,
    get4GeokInfo,
    isLucky
};
