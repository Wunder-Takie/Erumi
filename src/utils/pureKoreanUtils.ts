/**
 * pureKoreanUtils.ts
 * 순 우리말 이름 생성 및 평가 엔진
 */

import pureKoreanDb from '../data/korean/pure_korean_db.json' with { type: 'json' };
import type { PureKoreanNameResult, PureKoreanWordInfo } from '../types.ts';

// ==========================================
// Types
// ==========================================

type GenderFit = 'male' | 'female' | 'both';
type PositionType = 'first' | 'last' | 'any';

interface PureKoreanWord {
    word: string;
    meaning: string;
    meaning_story: string;
    emotion: string;
    imagery: string;
    syllables: number;
    modernity: number;
    beauty_score: number;
    gender_fit: GenderFit;
    position: PositionType;
}

interface DecomposedHangul {
    cho: string;
    jung: string;
    jong: string;
}

interface GenerateFilters {
    imagery?: string[];
    emotion?: string[];
    genderFit?: GenderFit;
    minModernity?: number;
    gender?: 'male' | 'female' | null;  // DevApp.tsx 호환
}

interface Combination {
    word1: PureKoreanWord;
    word2: PureKoreanWord;
    hangulName: string;
    fullName: string;
}

// ==========================================
// Constants
// ==========================================

const CHO_SEONG = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const JUNG_SEONG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
const JONG_SEONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

const typedPureKoreanDb = pureKoreanDb as PureKoreanWord[];

// ==========================================
// Internal Functions
// ==========================================

function decomposeHangul(char: string): DecomposedHangul | null {
    if (!char || char.length !== 1) return null;
    const code = char.charCodeAt(0);
    if (code < 0xAC00 || code > 0xD7A3) return null;
    const offset = code - 0xAC00;
    const choIndex = Math.floor(offset / (21 * 28));
    const jungIndex = Math.floor((offset % (21 * 28)) / 28);
    const jongIndex = offset % 28;
    return { cho: CHO_SEONG[choIndex], jung: JUNG_SEONG[jungIndex], jong: JONG_SEONG[jongIndex] };
}

function hasSurnameNameClash(surname: string, nameWord: string): boolean {
    if (!surname || !nameWord) return false;

    const surnameLast = surname[surname.length - 1];
    const nameFirst = nameWord[0];

    if (surnameLast === nameFirst) return true;

    const d1 = decomposeHangul(surnameLast);
    const d2 = decomposeHangul(nameFirst);

    if (!d1 || !d2) return false;

    if (d1.cho === d2.cho && d1.cho !== 'ㅇ') return true;
    if (d1.jung === d2.jung && d1.cho === d2.cho) return true;

    return false;
}

function isAwkwardSingleSyllable(word: PureKoreanWord): boolean {
    const awkwardWords = ['새', '참', '해', '환', '곧', '착', '바'];
    return word.syllables === 1 && awkwardWords.includes(word.word);
}

function isMeaningMatch(imagery1: string, imagery2: string): boolean {
    return imagery1 === imagery2;
}

function isMeaningComplement(imagery1: string, imagery2: string): boolean {
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

function isEmotionHarmony(emotion1: string, emotion2: string): boolean {
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

function hasSoundClash(word1: PureKoreanWord, word2: PureKoreanWord): boolean {
    const d1 = decomposeHangul(word1.word[word1.word.length - 1]);
    const d2 = decomposeHangul(word2.word[0]);

    if (!d1 || !d2) return false;

    if (d1.jong === 'ㄴ' && d2.cho === 'ㄹ') return true;
    if (d1.jong === 'ㄹ' && d2.cho === 'ㄴ') return true;
    if (d1.jong && d1.jong === d2.cho && d2.cho !== 'ㅇ') return true;

    return false;
}

function hasGoodRhythm(word1: PureKoreanWord, word2: PureKoreanWord): boolean {
    const totalSyllables = word1.syllables + word2.syllables;

    if (totalSyllables === 3 && word1.syllables !== word2.syllables) {
        return true;
    }

    if (totalSyllables === 4 && word1.syllables === 2 && word2.syllables === 2) {
        return true;
    }

    return false;
}

// ==========================================
// Exported Functions
// ==========================================

export function calculateMeaningHarmony(word1: PureKoreanWord, word2: PureKoreanWord): number {
    let score = 15;

    if (isMeaningMatch(word1.imagery, word2.imagery)) {
        score += 15;
    } else if (isMeaningComplement(word1.imagery, word2.imagery)) {
        score += 10;
    } else {
        score += 5;
    }

    if (word1.emotion === word2.emotion) {
        score += 10;
    } else if (isEmotionHarmony(word1.emotion, word2.emotion)) {
        score += 7;
    } else {
        score += 3;
    }

    const depth1 = word1.meaning_story.length > 15 ? 5 : 3;
    const depth2 = word2.meaning_story.length > 15 ? 5 : 3;
    score += Math.min(10, depth1 + depth2);

    return Math.max(15, Math.min(40, score));
}

export function calculateSoundBeauty(word1: PureKoreanWord, word2: PureKoreanWord): number {
    let score = 15;

    const avgBeauty = (word1.beauty_score + word2.beauty_score) / 2;
    score += avgBeauty;

    const syllableSum = word1.syllables + word2.syllables;
    if (syllableSum === 3) {
        score += 10;
    } else if (syllableSum === 4) {
        score += 8;
    } else if (syllableSum === 2) {
        score += 6;
    } else {
        score += 4;
    }

    if (!hasSoundClash(word1, word2)) {
        score += 8;
    }

    if (hasGoodRhythm(word1, word2)) {
        score += 5;
    }

    return Math.max(15, Math.min(40, score));
}

export function calculateHarmonyBonus(word1: PureKoreanWord, word2: PureKoreanWord): number {
    let bonus = 0;

    if (word1.modernity >= 9 && word2.modernity >= 9) {
        bonus += 5;
    }

    if (word1.gender_fit === word2.gender_fit) {
        bonus += 3;
    }

    if ((word1.imagery === '자연' && word2.imagery === '빛') ||
        (word1.imagery === '빛' && word2.imagery === '자연')) {
        bonus += 5;
    }

    if (word1.imagery === word2.imagery && word1.emotion === word2.emotion) {
        bonus += 4;
    }

    return Math.min(15, bonus);
}

export function calculateModernityForPureKorean(word1: PureKoreanWord, word2: PureKoreanWord): number {
    let score = 0;

    score += (word1.modernity + word2.modernity);

    const totalLength = word1.word.length + word2.word.length;
    if (totalLength === 3) {
        score += 20;
    } else if (totalLength === 2) {
        score += 12;
    } else if (totalLength === 4) {
        score += 3;
    } else {
        score += 0;
    }

    const trendyWords = ['아라', '나래', '다온', '한결', '슬기'];
    if (trendyWords.includes(word1.word) || trendyWords.includes(word2.word)) {
        score += 5;
    }

    return Math.max(0, Math.min(35, score));
}

export function generatePureKoreanNames(surnameInput: string, filters: GenerateFilters = {}): PureKoreanNameResult[] {
    let words = [...typedPureKoreanDb];

    if (filters.imagery && filters.imagery.length > 0) {
        words = words.filter(w => filters.imagery!.includes(w.imagery));
    }

    if (filters.emotion && filters.emotion.length > 0) {
        words = words.filter(w => filters.emotion!.includes(w.emotion));
    }

    if (filters.genderFit) {
        words = words.filter(w =>
            w.gender_fit === filters.genderFit || w.gender_fit === 'both'
        );
    }

    if (filters.minModernity) {
        words = words.filter(w => w.modernity >= filters.minModernity!);
    }

    // Single word names
    const singleResults: PureKoreanNameResult[] = [];
    const singleWords = words.filter(w => w.position !== 'last');

    for (const word of singleWords) {
        if (hasSurnameNameClash(surnameInput, word.word)) continue;
        if (isAwkwardSingleSyllable(word)) continue;

        const baseScore = 50;

        let syllableBonus = 0;
        if (word.syllables === 2) {
            syllableBonus = 25;
        } else if (word.syllables === 1) {
            syllableBonus = 10;
        }

        const modernityScore = word.modernity * 2.5;
        const rawScore = baseScore + syllableBonus + modernityScore;
        const score = Math.round((rawScore / 100) * 100);

        const wordInfo: PureKoreanWordInfo = {
            word: word.word,
            meaning: word.meaning,
            story: word.meaning_story,
            emotion: word.emotion,
            imagery: word.imagery
        };

        singleResults.push({
            hangulName: word.word,
            fullName: surnameInput + word.word,
            word1: wordInfo,
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

    // Combination names
    const combinations: Combination[] = [];
    const firstWords = words.filter(w => w.position !== 'last');
    const secondWords = words.filter(w => w.position !== 'first');

    const seenPairs = new Set<string>();

    for (const word1 of firstWords) {
        for (const word2 of secondWords) {
            if (hasSurnameNameClash(surnameInput, word1.word)) continue;
            if (word1.word === word2.word) continue;

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

    const combinationResults: PureKoreanNameResult[] = combinations.map(c => {
        let baseScore = 20;
        const meaningScore = calculateMeaningHarmony(c.word1, c.word2);
        const soundScore = calculateSoundBeauty(c.word1, c.word2);
        const harmonyScore = calculateHarmonyBonus(c.word1, c.word2);
        const modernityScore = calculateModernityForPureKorean(c.word1, c.word2);

        const totalLength = c.word1.word.length + c.word2.word.length;

        if (totalLength === 3) {
            if (!(c.word1.modernity >= 8 && c.word2.modernity >= 8 && meaningScore >= 35)) {
                baseScore -= 25;
            }
        } else if (totalLength === 4) {
            if (!(c.word1.modernity >= 10 && c.word2.modernity >= 10 && meaningScore >= 38)) {
                baseScore -= 30;
            }
        }

        const rawScore = baseScore + meaningScore + soundScore + harmonyScore + modernityScore;
        const score = Math.round((rawScore / 155) * 100);

        const word1Info: PureKoreanWordInfo = {
            word: c.word1.word,
            meaning: c.word1.meaning,
            story: c.word1.meaning_story,
            emotion: c.word1.emotion,
            imagery: c.word1.imagery
        };

        const word2Info: PureKoreanWordInfo = {
            word: c.word2.word,
            meaning: c.word2.meaning,
            story: c.word2.meaning_story,
            emotion: c.word2.emotion,
            imagery: c.word2.imagery
        };

        return {
            hangulName: c.hangulName,
            fullName: c.fullName,
            word1: word1Info,
            word2: word2Info,
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

    const scored = [...singleResults, ...combinationResults];
    return scored.sort((a, b) => b.score - a.score);
}

export default {
    generatePureKoreanNames,
    calculateMeaningHarmony,
    calculateSoundBeauty,
    calculateHarmonyBonus,
    calculateModernityForPureKorean
};
