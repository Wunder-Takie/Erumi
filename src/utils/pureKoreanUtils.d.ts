/**
 * TypeScript 타입 정의 for pureKoreanUtils.js
 */

import { PureKoreanWordInfo, PureKoreanNameResult } from '../types';

export { PureKoreanWordInfo, PureKoreanNameResult };

export function generatePureKoreanNames(
    surnameInput: string,
    options?: { gender?: string | null }
): PureKoreanNameResult[];

export function calculateMeaningHarmony(word1: PureKoreanWordInfo, word2: PureKoreanWordInfo): number;
export function calculateSoundBeauty(word1: PureKoreanWordInfo, word2: PureKoreanWordInfo): number;
export function calculateHarmonyBonus(word1: PureKoreanWordInfo, word2: PureKoreanWordInfo): number;
export function calculateModernityForPureKorean(word1: PureKoreanWordInfo, word2: PureKoreanWordInfo): number;


export default {
    generatePureKoreanNames,
    calculateMeaningHarmony,
    calculateSoundBeauty,
    calculateHarmonyBonus,
    calculateModernityForPureKorean
};
