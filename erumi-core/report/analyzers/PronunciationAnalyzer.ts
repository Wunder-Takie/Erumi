/**
 * Erumi Report Engine - Pronunciation Analyzer
 * 발음오행 분석
 */

import type { ReportInput, PronunciationResult } from '../types';
import hanjaDb from '../../data/core/hanja_db.json' with { type: 'json' };
import surnames from '../../data/core/surnames.json' with { type: 'json' };

interface HanjaEntry {
    hanja: string;
    hangul: string;
    element?: string;
}

interface SurnameVariant {
    hanja: string;
    strokes: number;
    element: string;
    meaning: string;
    examples: string;
    is_major: boolean;
}

type SurnamesData = Record<string, SurnameVariant[]>;

// 오행 상생 관계: 목→화→토→금→수→목
const ELEMENT_GENERATION: Record<string, string> = {
    Wood: 'Fire',
    Fire: 'Earth',
    Earth: 'Metal',
    Metal: 'Water',
    Water: 'Wood',
};

// 오행 상극 관계: 목→토, 토→수, 수→화, 화→금, 금→목
const ELEMENT_OVERCOMING: Record<string, string> = {
    Wood: 'Earth',
    Earth: 'Water',
    Water: 'Fire',
    Fire: 'Metal',
    Metal: 'Wood',
};

const ELEMENT_KOREAN: Record<string, string> = {
    Wood: '목(木)',
    Fire: '화(火)',
    Earth: '토(土)',
    Metal: '금(金)',
    Water: '수(水)',
};

export class PronunciationAnalyzer {
    private hanjaMap: Map<string, HanjaEntry>;
    private surnamesData: SurnamesData;

    constructor() {
        this.hanjaMap = new Map(
            (hanjaDb as HanjaEntry[]).map(h => [h.hanja, h])
        );
        this.surnamesData = surnames as SurnamesData;
    }

    /**
     * 한글 성씨로 한자 variant 조회
     */
    private getSurnameVariant(hangul: string, hanja?: string): SurnameVariant | undefined {
        const variants = this.surnamesData[hangul];
        if (!variants || variants.length === 0) return undefined;

        if (hanja) {
            return variants.find(v => v.hanja === hanja) || variants.find(v => v.is_major) || variants[0];
        }
        return variants.find(v => v.is_major) || variants[0];
    }

    /**
     * 발음오행 분석
     */
    async analyze(input: ReportInput): Promise<PronunciationResult> {
        const characters: PronunciationResult['characters'] = [];

        // 성씨
        const surnameElement = this.getElement(input.surname, input.surnameHanja, true);
        characters.push({
            hanja: input.surnameHanja,
            hangul: input.surname,
            element: surnameElement,
            elementKorean: ELEMENT_KOREAN[surnameElement] || surnameElement,
        });

        // 이름 글자
        for (let i = 0; i < input.givenNameHanja.length; i++) {
            const element = this.getElement('', input.givenNameHanja[i], false);
            characters.push({
                hanja: input.givenNameHanja[i],
                hangul: input.givenName[i],
                element,
                elementKorean: ELEMENT_KOREAN[element] || element,
            });
        }

        // 관계 분석
        const relationship = this.analyzeRelationship(characters.map(c => c.element));
        const summary = this.generateSummary(characters, relationship);

        return {
            description: '이름을 소리 내어 불렀을 때, 소리의 기운끼리 서로 돕는지 싸우는지 볼 때 사용해요.',
            characters,
            relationship,
            summary,
        };
    }

    /**
     * 오행 조회
     */
    private getElement(hangul: string, hanja: string, isSurname: boolean): string {
        if (isSurname) {
            const variant = this.getSurnameVariant(hangul, hanja);
            if (variant) return variant.element;
        }
        const entry = this.hanjaMap.get(hanja);
        return entry?.element ?? 'Earth';
    }

    /**
     * 오행 관계 분석
     */
    private analyzeRelationship(elements: string[]): 'harmonious' | 'conflicting' | 'neutral' {
        let harmoniousCount = 0;
        let conflictingCount = 0;

        for (let i = 0; i < elements.length - 1; i++) {
            const current = elements[i];
            const next = elements[i + 1];

            // 상생 체크
            if (ELEMENT_GENERATION[current] === next) {
                harmoniousCount++;
            }
            // 상극 체크
            if (ELEMENT_OVERCOMING[current] === next) {
                conflictingCount++;
            }
        }

        if (harmoniousCount > conflictingCount) return 'harmonious';
        if (conflictingCount > harmoniousCount) return 'conflicting';
        return 'neutral';
    }

    /**
     * 요약 생성
     */
    private generateSummary(
        characters: PronunciationResult['characters'],
        relationship: 'harmonious' | 'conflicting' | 'neutral'
    ): string {
        const elements = characters.map(c => ELEMENT_KOREAN[c.element] || c.element);
        const elementList = elements.join(', ');

        if (relationship === 'harmonious') {
            return `${elementList}의 기운이 서로 상생하여 조화롭게 흐르는 좋은 발음 구조입니다.`;
        }
        if (relationship === 'conflicting') {
            return `${elementList}이 만나 서로 부딪히며 스파크를 일으키는 구조입니다. 이는 평범한 안정보다는, 기존의 틀을 깨는 예술가나 혁신가에게서 나타나는 강한 개성의 소리입니다.`;
        }
        return `${elementList}의 기운이 중립적으로 배치되어 안정적인 발음 구조입니다.`;
    }
}
