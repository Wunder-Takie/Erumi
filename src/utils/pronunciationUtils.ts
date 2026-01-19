/**
 * pronunciationUtils.ts
 * 발음오행 및 발음음양 분석 유틸리티
 */

import consonantElements from '../data/saju/consonant_elements.json' with { type: 'json' };

// ==========================================
// Types
// ==========================================

type ElementType = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';
type YinYangType = '양' | '음';
type BalanceType = 'yang' | 'yin' | 'balanced';

interface DecomposedHangul {
    initial: string;
    final: string;
}

interface ElementSyllableInfo {
    char: string;
    initial: string;
    final: string;
    initialElement: ElementType | null;
    finalElement: ElementType | null;
    initialKorean?: string;
    finalKorean?: string;
}

interface YinYangSyllableInfo {
    char: string;
    initialYinYang: YinYangType | null;
    finalYinYang: YinYangType | null;
}

interface ElementDistribution {
    Wood: number;
    Fire: number;
    Earth: number;
    Metal: number;
    Water: number;
}

export interface PronunciationElementsResult {
    syllables: ElementSyllableInfo[];
    elements: ElementDistribution;
    primaryElement: string | null;
    secondaryElement: string | null;
    summary: string;
}

export interface PronunciationYinYangResult {
    syllables: YinYangSyllableInfo[];
    yang: number;
    yin: number;
    balance: number;
    balanceType: BalanceType;
    summary: string;
}

export interface FullPronunciationResult {
    elements: PronunciationElementsResult;
    yinYang: PronunciationYinYangResult;
}

interface ConsonantInfo {
    element: ElementType;
    korean: string;
    yinYang: YinYangType;
}

interface ElementInfo {
    emoji: string;
    korean: string;
}

interface YinYangInfo {
    emoji: string;
}

interface ConsonantElementsData {
    initial: Record<string, ConsonantInfo>;
    final: Record<string, ConsonantInfo>;
    elementInfo: Record<string, ElementInfo>;
    yinYangInfo: Record<string, YinYangInfo>;
}

// ==========================================
// Constants
// ==========================================

const CHO_SEONG = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
    'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

const JONG_SEONG = [
    '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
    'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
    'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

const typedConsonantElements = consonantElements as ConsonantElementsData;

// ==========================================
// Internal Functions
// ==========================================

function decomposeHangul(char: string): DecomposedHangul | null {
    const code = char.charCodeAt(0);
    if (code < 0xAC00 || code > 0xD7A3) return null;

    const offset = code - 0xAC00;
    const choIndex = Math.floor(offset / (21 * 28));
    const jongIndex = offset % 28;

    return {
        initial: CHO_SEONG[choIndex],
        final: JONG_SEONG[jongIndex]
    };
}

function generateElementSummary(elements: ElementDistribution): string {
    const elementInfo = typedConsonantElements.elementInfo;
    const entries = Object.entries(elements).filter(([, count]) => count > 0);

    if (entries.length === 0) {
        return "발음 오행을 분석할 수 없어요.";
    }

    const sorted = entries.sort((a, b) => b[1] - a[1]);
    const primary = sorted[0];
    const info = elementInfo[primary[0]];

    return `${info.emoji} ${info.korean} 기운이 가장 강해요.`;
}

function generateYinYangSummary(balanceType: BalanceType): string {
    const yinYangInfo = typedConsonantElements.yinYangInfo;

    if (balanceType === 'yang') {
        return `${yinYangInfo['양'].emoji} 양(陽)의 기운이 강해요. 밝고 활발한 에너지를 가져요.`;
    } else if (balanceType === 'yin') {
        return `${yinYangInfo['음'].emoji} 음(陰)의 기운이 강해요. 차분하고 깊은 에너지를 가져요.`;
    } else {
        return `☯️ 음양이 조화롭게 균형을 이루고 있어요.`;
    }
}

// ==========================================
// Exported Functions
// ==========================================

export function analyzePronunciationElements(name: string): PronunciationElementsResult {
    const syllables: ElementSyllableInfo[] = [];
    const elements: ElementDistribution = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };

    for (let i = 0; i < name.length; i++) {
        const char = name[i];
        const decomposed = decomposeHangul(char);

        if (!decomposed) continue;

        const syllableInfo: ElementSyllableInfo = {
            char,
            initial: decomposed.initial,
            final: decomposed.final,
            initialElement: null,
            finalElement: null
        };

        if (typedConsonantElements.initial[decomposed.initial]) {
            const info = typedConsonantElements.initial[decomposed.initial];
            syllableInfo.initialElement = info.element;
            syllableInfo.initialKorean = info.korean;
            elements[info.element]++;
        }

        if (decomposed.final && typedConsonantElements.final[decomposed.final]) {
            const info = typedConsonantElements.final[decomposed.final];
            syllableInfo.finalElement = info.element;
            syllableInfo.finalKorean = info.korean;
            elements[info.element]++;
        }

        syllables.push(syllableInfo);
    }

    const sortedElements = Object.entries(elements)
        .sort((a, b) => b[1] - a[1])
        .filter(([, count]) => count > 0);

    const primaryElement = sortedElements[0]?.[0] || null;
    const secondaryElement = sortedElements[1]?.[0] || null;

    return {
        syllables,
        elements,
        primaryElement,
        secondaryElement,
        summary: generateElementSummary(elements)
    };
}

export function analyzePronunciationYinYang(name: string): PronunciationYinYangResult {
    let yang = 0;
    let yin = 0;
    const syllables: YinYangSyllableInfo[] = [];

    for (let i = 0; i < name.length; i++) {
        const char = name[i];
        const decomposed = decomposeHangul(char);

        if (!decomposed) continue;

        const syllableInfo: YinYangSyllableInfo = {
            char,
            initialYinYang: null,
            finalYinYang: null
        };

        if (typedConsonantElements.initial[decomposed.initial]) {
            const info = typedConsonantElements.initial[decomposed.initial];
            syllableInfo.initialYinYang = info.yinYang;
            if (info.yinYang === '양') yang++;
            else yin++;
        }

        if (decomposed.final && typedConsonantElements.final[decomposed.final]) {
            const info = typedConsonantElements.final[decomposed.final];
            syllableInfo.finalYinYang = info.yinYang;
            if (info.yinYang === '양') yang++;
            else yin++;
        }

        syllables.push(syllableInfo);
    }

    const total = yang + yin;
    const balance = total > 0 ? (yang / total) : 0.5;

    let balanceType: BalanceType;
    if (balance > 0.6) balanceType = 'yang';
    else if (balance < 0.4) balanceType = 'yin';
    else balanceType = 'balanced';

    return {
        syllables,
        yang,
        yin,
        balance,
        balanceType,
        summary: generateYinYangSummary(balanceType)
    };
}

export function analyzeFullPronunciation(name: string): FullPronunciationResult {
    return {
        elements: analyzePronunciationElements(name),
        yinYang: analyzePronunciationYinYang(name)
    };
}
