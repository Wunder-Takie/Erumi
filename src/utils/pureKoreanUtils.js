/**
 * pureKoreanUtils.js
 * 순 우리말 이름 생성 및 평가 엔진
 */

import pureKoreanDb from '../data/pure_korean_db.json' with { type: 'json' };
import { decomposeHangul } from './naming/helpers.js';


/**
 * 성과 이름의 음운 충돌 감지
 * 예: 하 + 하늘 = 하하늘 (어색)
 */
function hasSurnameNameClash(surname, nameWord) {
    if (!surname || !nameWord) return false;

    const surnameLast = surname[surname.length - 1];
    const nameFirst = nameWord[0];

    // 1. 완전히 같은 음절 (하 + 하늘, 이 + 이슬)
    if (surnameLast === nameFirst) return true;

    // 2. 한글 분해하여 초성이 같은지 확인
    const d1 = decomposeHangul(surnameLast);
    const d2 = decomposeHangul(nameFirst);

    if (!d1 || !d2) return false;

    // 같은 초성으로 시작 (김 + 강, 박 + 빛)
    if (d1.cho === d2.cho && d1.cho !== 'ㅇ') return true;

    // 같은 중성 (김 + 감 같은 경우)
    if (d1.jung === d2.jung && d1.cho === d2.cho) return true;

    return false;
}


/**
 * 어색한 1음절 단어 필터
 * 이름으로 사용하기 어색한 단어들
 */
function isAwkwardSingleSyllable(word) {
    const awkwardWords = [
        '새', '참', '해', '환', '곧', '착', '바'
    ];
    return word.syllables === 1 && awkwardWords.includes(word.word);
}

// ============================================
// 1. 의미 조화 평가
// ============================================

/**
 * 이미지 카테고리 매칭 체크
 */
function isMeaningMatch(imagery1, imagery2) {
    return imagery1 === imagery2;
}

/**
 * 이미지 카테고리 상보성 체크
 */
function isMeaningComplement(imagery1, imagery2) {
    const complementPairs = [
        ['자연', '빛'],
        ['자연', '소리'],
        ['빛', '감정'],
        ['가치', '감정']
    ];

    return complementPairs.some(([a, b]) =>
        (imagery1 === a && imagery2 === b) || (imagery1 === b && imagery2 === a)
    );
}

/**
 * 감정 조화 체크
 */
function isEmotionHarmony(emotion1, emotion2) {
    const harmonyGroups = [
        ['희망적', '밝은', '활기찬'],
        ['따뜻한', '평화로운', '순수한'],
        ['강인한', '웅장한', '자유로운'],
        ['현명한', '진실한']
    ];

    return harmonyGroups.some(group =>
        group.includes(emotion1) && group.includes(emotion2)
    );
}

/**
 * 의미 조화 점수 계산 (Suri 대체)
 */
export function calculateMeaningHarmony(word1, word2) {
    let score = 15; // 기본 보장

    // 1. 이미지 조화 (최대 15점)
    if (isMeaningMatch(word1.imagery, word2.imagery)) {
        score += 15; // 같은 이미지 계열
    } else if (isMeaningComplement(word1.imagery, word2.imagery)) {
        score += 10; // 상보적 이미지
    } else {
        score += 5; // 기본 점수
    }

    // 2. 감정 조화 (최대 10점)
    if (word1.emotion === word2.emotion) {
        score += 10; // 같은 감정 톤
    } else if (isEmotionHarmony(word1.emotion, word2.emotion)) {
        score += 7; // 조화로운 감정
    } else {
        score += 3; // 기본 점수
    }

    // 3. 의미 깊이 (최대 10점)
    const depth1 = word1.meaning_story.length > 15 ? 5 : 3;
    const depth2 = word2.meaning_story.length > 15 ? 5 : 3;
    score += Math.min(10, depth1 + depth2);

    return Math.max(15, Math.min(40, score));
}

// ============================================
// 2. 음성미 평가
// ============================================

/**
 * 발음 충돌 체크
 */
function hasSoundClash(word1, word2) {
    const d1 = decomposeHangul(word1.word[word1.word.length - 1]);
    const d2 = decomposeHangul(word2.word[0]);

    if (!d1 || !d2) return false;

    // 받침-초성 충돌
    if (d1.jong === 'ㄴ' && d2.cho === 'ㄹ') return true;
    if (d1.jong === 'ㄹ' && d2.cho === 'ㄴ') return true;

    // 같은 자음 연속 (ㅇ 제외)
    if (d1.jong && d1.jong === d2.cho && d2.cho !== 'ㅇ') return true;

    return false;
}

/**
 * 리듬감 평가
 */
function hasGoodRhythm(word1, word2) {
    const totalSyllables = word1.syllables + word2.syllables;

    // 2+1 또는 1+2 조합은 리듬감이 좋음
    if (totalSyllables === 3 && word1.syllables !== word2.syllables) {
        return true;
    }

    // 2+2 조합도 좋음
    if (totalSyllables === 4 && word1.syllables === 2 && word2.syllables === 2) {
        return true;
    }

    return false;
}

/**
 * 음성미 점수 계산 (Element 대체)
 */
export function calculateSoundBeauty(word1, word2) {
    let score = 15; // 기본 보장

    // 1. 개별 음성미 (최대 10점)
    const avgBeauty = (word1.beauty_score + word2.beauty_score) / 2;
    score += avgBeauty; // 0~10점

    // 2. 음절 조화 (최대 10점)
    const syllableSum = word1.syllables + word2.syllables;
    if (syllableSum === 3) {
        score += 10; // 2+1 또는 1+2 (최고)
    } else if (syllableSum === 4) {
        score += 8; // 2+2 (좋음)
    } else if (syllableSum === 2) {
        score += 6; // 1+1 (짧고 강렬)
    } else {
        score += 4; // 기타
    }

    // 3. 발음 충돌 없음 (최대 8점)
    if (!hasSoundClash(word1, word2)) {
        score += 8;
    }

    // 4. 리듬감 (최대 5점)
    if (hasGoodRhythm(word1, word2)) {
        score += 5;
    }

    return Math.max(15, Math.min(40, score));
}

// ============================================
// 3. 조화 보너스
// ============================================

/**
 * 특별한 의미 조화 보너스
 */
export function calculateHarmonyBonus(word1, word2) {
    let bonus = 0;

    // 1. 현대성 일치 (둘 다 현대적)
    if (word1.modernity >= 9 && word2.modernity >= 9) {
        bonus += 5;
    }

    // 2. 성별 적합성 일치
    if (word1.gender_fit === word2.gender_fit) {
        bonus += 3;
    }

    // 3. 특별 조합 (자연 + 빛)
    if ((word1.imagery === '자연' && word2.imagery === '빛') ||
        (word1.imagery === '빛' && word2.imagery === '자연')) {
        bonus += 5;
    }

    // 4. 의미 일관성 (둘 다 같은 카테고리)
    if (word1.imagery === word2.imagery && word1.emotion === word2.emotion) {
        bonus += 4;
    }

    return Math.min(15, bonus);
}

// ============================================
// 4. 현대성 평가 (순 우리말 버전)
// ============================================

/**
 * 순 우리말 현대성 점수
 */
export function calculateModernityForPureKorean(word1, word2) {
    let score = 0;

    // 1. 개별 현대성 점수 (최대 20점)
    score += (word1.modernity + word2.modernity); // 0~20점

    // 2. 전체 이름 길이 (최대 15점, 3글자 강력 선호)
    const totalLength = word1.word.length + word2.word.length;
    if (totalLength === 3) {
        score += 20; // 3글자 (최적) - 자연스러운 조합
    } else if (totalLength === 2) {
        score += 12; // 2글자 (짧지만 좋음)
    } else if (totalLength === 4) {
        score += 3; // 4글자 (너무 긺) - 페널티
    } else {
        score += 0; // 5글자 이상 - 강한 페널티
    }

    // 3. 트렌디한 조합 (최대 5점)
    const trendyWords = ['아라', '나래', '다온', '한결', '슬기'];
    if (trendyWords.includes(word1.word) || trendyWords.includes(word2.word)) {
        score += 5;
    }

    return Math.max(0, Math.min(35, score));
}

// ============================================
// 5. 메인 함수: 순 우리말 이름 생성
// ============================================

/**
 * 순 우리말 이름 생성
 */
export function generatePureKoreanNames(surnameInput, filters = {}) {
    // 1. DB 로드 및 필터링
    let words = [...pureKoreanDb];

    if (filters.imagery && filters.imagery.length > 0) {
        words = words.filter(w => filters.imagery.includes(w.imagery));
    }

    if (filters.emotion && filters.emotion.length > 0) {
        words = words.filter(w => filters.emotion.includes(w.emotion));
    }

    if (filters.genderFit) {
        words = words.filter(w =>
            w.gender_fit === filters.genderFit || w.gender_fit === 'both'
        );
    }

    if (filters.minModernity) {
        words = words.filter(w => w.modernity >= filters.minModernity);
    }

    // 2-1. 한 음절 단독 이름 생성 (우선)
    const singleResults = [];
    const singleWords = words.filter(w => w.position !== 'last');

    for (const word of singleWords) {
        // 성-이름 음운 충돌 체크
        if (hasSurnameNameClash(surnameInput, word.word)) continue;

        // 어색한 1음절 단어 필터
        if (isAwkwardSingleSyllable(word)) continue;

        const baseScore = 50; // 단독 사용 기본 점수 (단일 단어 우대)

        // 음절 보너스: 2음절 단일 단어 강력 우대
        let syllableBonus = 0;
        if (word.syllables === 2) {
            syllableBonus = 25; // 2음절 최고 (하늘, 슬기, 다솜)
        } else if (word.syllables === 1) {
            syllableBonus = 10; // 1음절 좋음 (별, 빛, 솔)
        }

        const modernityScore = word.modernity * 2.5; // 0~25

        const rawScore = baseScore + syllableBonus + modernityScore;
        const score = Math.round((rawScore / 100) * 100);

        singleResults.push({
            hangulName: word.word,
            fullName: surnameInput + word.word,
            word1: {
                word: word.word,
                meaning: word.meaning,
                story: word.meaning_story,
                emotion: word.emotion,
                imagery: word.imagery
            },
            word2: null,
            isSingle: true,
            score: Math.max(0, Math.min(100, score)),
            scoreBreakdown: {
                base: baseScore,
                syllableBonus: syllableBonus,
                modernity: modernityScore,
                raw: rawScore
            }
        });
    }

    // 2-2. 조합 생성 (선택적, 낮은 점수)
    const combinations = [];
    const firstWords = words.filter(w => w.position !== 'last');
    const secondWords = words.filter(w => w.position !== 'first');

    const seenPairs = new Set();

    for (const word1 of firstWords) {
        for (const word2 of secondWords) {
            // 0. 성-이름 음운 충돌 체크
            if (hasSurnameNameClash(surnameInput, word1.word)) continue;

            // 1. 같은 단어 중복 방지
            if (word1.word === word2.word) continue;

            // 2. 역순 중복 방지
            const sortedKey = [word1.word, word2.word].sort().join('|');
            if (seenPairs.has(sortedKey)) continue;
            seenPairs.add(sortedKey);

            combinations.push({
                word1,
                word2,
                hangulName: word1.word + word2.word,
                fullName: surnameInput + word1.word + word2.word
            });
        }
    }

    // 3. 조합 점수 계산 (품질 기준 필터)
    const combinationResults = combinations.map(c => {
        let baseScore = 20; // 조합은 기본적으로 낮은 점수
        const meaningScore = calculateMeaningHarmony(c.word1, c.word2);
        const soundScore = calculateSoundBeauty(c.word1, c.word2);
        const harmonyScore = calculateHarmonyBonus(c.word1, c.word2);
        const modernityScore = calculateModernityForPureKorean(c.word1, c.word2);

        // 로직 기반 품질 필터
        const totalLength = c.word1.word.length + c.word2.word.length;

        if (totalLength === 3) {
            // 3글자 조합: 양쪽 모두 현대성 8+ AND 의미조화 35+
            if (c.word1.modernity >= 8 && c.word2.modernity >= 8 && meaningScore >= 35) {
                // 품질 조건 충족 - 통과
            } else {
                // 품질 미달 - 강한 페널티
                baseScore -= 25; // 실질적으로 필터 아웃
            }
        } else if (totalLength === 4) {
            // 4글자 조합: 양쪽 모두 현대성 10 AND 완벽한 조화
            if (c.word1.modernity >= 10 && c.word2.modernity >= 10 && meaningScore >= 38) {
                // 극히 드물게 통과
            } else {
                // 대부분 필터 아웃
                baseScore -= 30;
            }
        }
        // 5글자 이상은 이미 생성 단계에서 차단됨

        const rawScore = baseScore + meaningScore + soundScore + harmonyScore + modernityScore;
        const score = Math.round((rawScore / 155) * 100);

        return {
            hangulName: c.hangulName,
            fullName: c.fullName,
            word1: {
                word: c.word1.word,
                meaning: c.word1.meaning,
                story: c.word1.meaning_story,
                emotion: c.word1.emotion,
                imagery: c.word1.imagery
            },
            word2: {
                word: c.word2.word,
                meaning: c.word2.meaning,
                story: c.word2.meaning_story,
                emotion: c.word2.emotion,
                imagery: c.word2.imagery
            },
            isSingle: false,
            score: Math.max(0, Math.min(100, score)),
            scoreBreakdown: {
                base: baseScore,
                meaning: meaningScore,
                sound: soundScore,
                harmony: harmonyScore,
                modernity: modernityScore,
                raw: rawScore
            }
        };
    });

    // 4. 단독 + 조합 결과 합치기
    const scored = [...singleResults, ...combinationResults];

    // 4. 정렬 및 반환
    return scored.sort((a, b) => b.score - a.score);
}

export default {
    generatePureKoreanNames,
    calculateMeaningHarmony,
    calculateSoundBeauty,
    calculateHarmonyBonus,
    calculateModernityForPureKorean
};
