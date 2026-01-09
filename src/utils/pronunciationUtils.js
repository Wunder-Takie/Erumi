/**
 * pronunciationUtils.js
 * 발음오행 및 발음음양 분석 유틸리티
 */

import consonantElements from '../data/consonant_elements.json' with { type: 'json' };

// 한글 자모 분해용 상수
const CHO_SEONG = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
    'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

const JONG_SEONG = [
    '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
    'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
    'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

/**
 * 한글 음절을 초성/종성으로 분해
 */
function decomposeHangul(char) {
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

/**
 * 이름의 발음오행 분석
 * @param {string} name - 이름 (성 제외)
 * @returns {object} 발음오행 분석 결과
 */
export function analyzePronunciationElements(name) {
    const syllables = [];
    const elements = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };

    for (let i = 0; i < name.length; i++) {
        const char = name[i];
        const decomposed = decomposeHangul(char);

        if (!decomposed) continue;

        const syllableInfo = {
            char,
            initial: decomposed.initial,
            final: decomposed.final,
            initialElement: null,
            finalElement: null
        };

        // 초성 오행
        if (consonantElements.initial[decomposed.initial]) {
            const info = consonantElements.initial[decomposed.initial];
            syllableInfo.initialElement = info.element;
            syllableInfo.initialKorean = info.korean;
            elements[info.element]++;
        }

        // 종성 오행 (있는 경우)
        if (decomposed.final && consonantElements.final[decomposed.final]) {
            const info = consonantElements.final[decomposed.final];
            syllableInfo.finalElement = info.element;
            syllableInfo.finalKorean = info.korean;
            elements[info.element]++;
        }

        syllables.push(syllableInfo);
    }

    // 주요 오행 결정
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

/**
 * 이름의 발음음양 분석
 * @param {string} name - 이름 (성 제외)
 * @returns {object} 발음음양 분석 결과
 */
export function analyzePronunciationYinYang(name) {
    let yang = 0;
    let yin = 0;
    const syllables = [];

    for (let i = 0; i < name.length; i++) {
        const char = name[i];
        const decomposed = decomposeHangul(char);

        if (!decomposed) continue;

        const syllableInfo = {
            char,
            initialYinYang: null,
            finalYinYang: null
        };

        // 초성 음양
        if (consonantElements.initial[decomposed.initial]) {
            const info = consonantElements.initial[decomposed.initial];
            syllableInfo.initialYinYang = info.yinYang;
            if (info.yinYang === '양') yang++;
            else yin++;
        }

        // 종성 음양 (있는 경우)
        if (decomposed.final && consonantElements.final[decomposed.final]) {
            const info = consonantElements.final[decomposed.final];
            syllableInfo.finalYinYang = info.yinYang;
            if (info.yinYang === '양') yang++;
            else yin++;
        }

        syllables.push(syllableInfo);
    }

    const total = yang + yin;
    const balance = total > 0 ? (yang / total) : 0.5;

    let balanceType;
    if (balance > 0.6) balanceType = 'yang';
    else if (balance < 0.4) balanceType = 'yin';
    else balanceType = 'balanced';

    return {
        syllables,
        yang,
        yin,
        balance,
        balanceType,
        summary: generateYinYangSummary(balanceType, yang, yin)
    };
}

/**
 * 오행 분포 요약 생성
 */
function generateElementSummary(elements) {
    const elementInfo = consonantElements.elementInfo;
    const entries = Object.entries(elements).filter(([, count]) => count > 0);

    if (entries.length === 0) {
        return "발음 오행을 분석할 수 없어요.";
    }

    const sorted = entries.sort((a, b) => b[1] - a[1]);
    const primary = sorted[0];
    const info = elementInfo[primary[0]];

    return `${info.emoji} ${info.korean} 기운이 가장 강해요.`;
}

/**
 * 음양 균형 요약 생성
 */
function generateYinYangSummary(balanceType, yang, yin) {
    const yinYangInfo = consonantElements.yinYangInfo;

    if (balanceType === 'yang') {
        return `${yinYangInfo['양'].emoji} 양(陽)의 기운이 강해요. 밝고 활발한 에너지를 가져요.`;
    } else if (balanceType === 'yin') {
        return `${yinYangInfo['음'].emoji} 음(陰)의 기운이 강해요. 차분하고 깊은 에너지를 가져요.`;
    } else {
        return `☯️ 음양이 조화롭게 균형을 이루고 있어요.`;
    }
}

/**
 * 전체 발음 분석 (오행 + 음양)
 */
export function analyzeFullPronunciation(name) {
    return {
        elements: analyzePronunciationElements(name),
        yinYang: analyzePronunciationYinYang(name)
    };
}
