/**
 * Erumi Report Engine - Natural Element Analyzer
 * 자원오행 분석 (사주 + 이름 오행 그래프)
 */

import type { ReportInput, NaturalElementResult, ElementGraph } from '../types';
import hanjaDb from '../../data/core/hanja_db.json' with { type: 'json' };
import surnames from '../../data/core/surnames.json' with { type: 'json' };

interface HanjaEntry {
    hanja: string;
    element?: string;
}

interface SurnameVariant {
    hanja: string;
    strokes: number;
    element: string;
    hun: string;
    eum: string;
    examples: string;
    is_major: boolean;
}

type SurnamesData = Record<string, SurnameVariant[]>;

const ELEMENT_KEYS = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'] as const;

const ELEMENT_KOREAN: Record<string, string> = {
    Wood: '목(木)',
    Fire: '화(火)',
    Earth: '토(土)',
    Metal: '금(金)',
    Water: '수(水)',
};

export class NaturalElementAnalyzer {
    private hanjaMap: Map<string, HanjaEntry>;
    private surnamesData: SurnamesData;

    constructor() {
        this.hanjaMap = new Map(
            (hanjaDb as HanjaEntry[]).map(h => [h.hanja, h])
        );
        this.surnamesData = surnames as SurnamesData;
    }

    /**
     * 한글 성씨로 한자 variant 조회 (한자가 있으면 해당 variant, 없으면 is_major=true)
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
     * 자원오행 분석
     */
    async analyze(input: ReportInput): Promise<NaturalElementResult> {
        // 사주 정보 유무 확인
        const hasSaju = !!(input.saju?.elements && Object.keys(input.saju.elements).length > 0);

        // 사주 오행 그래프 (없으면 null)
        const sajuElements = hasSaju ? this.getSajuElementGraph(input) : null;

        // 이름 오행 그래프
        const nameElements = this.getNameElementGraph(input);

        // 채워주는 오행 목록 (사주 없으면 빈 배열 - UI에서 플레이스홀더 표시)
        const yongsin = input.saju?.yongsin;
        const filledElements = hasSaju && sajuElements
            ? this.findFilledElements(sajuElements, nameElements, yongsin)
            : [];

        // 요약 생성 (사주도 전달)
        const summary = hasSaju && sajuElements
            ? this.generateSummary(sajuElements, filledElements, nameElements)
            : this.generateNoSajuSummary(nameElements);

        return {
            description: hasSaju
                ? '한자가 본래 가지고 있는 자연의 성질(불, 물, 나무 등)이 사주에 필요한 기운인지 보는 거에요.'
                : '이름이 가진 오행의 분포를 보여드립니다. 사주를 입력하시면 더 정확한 분석이 가능해요.',
            hasSaju,
            sajuElements,
            nameElements,
            filledElements,
            summary,
        };
    }

    /**
     * 사주 오행 그래프 (0-100%)
     * input.saju.elements는 이미 퍼센트 값이거나 카운트 값일 수 있음
     */
    private getSajuElementGraph(input: ReportInput): ElementGraph {
        if (input.saju?.elements) {
            const els = input.saju.elements;
            // PascalCase와 lowercase 모두 지원
            const getValue = (key: string): number => {
                const pascal = key.charAt(0).toUpperCase() + key.slice(1);
                return els[pascal] ?? els[key.toLowerCase()] ?? 0;
            };

            // 값이 이미 퍼센트인지 카운트인지 판단 (합계가 100 근처면 퍼센트)
            const total = Object.values(els).reduce((a, b) => (a as number) + (b as number), 0) as number;
            const isPercent = total >= 95 && total <= 105; // 합계가 ~100이면 퍼센트로 간주

            return {
                wood: isPercent ? getValue('Wood') : Math.min(getValue('Wood') * 20, 100),
                fire: isPercent ? getValue('Fire') : Math.min(getValue('Fire') * 20, 100),
                earth: isPercent ? getValue('Earth') : Math.min(getValue('Earth') * 20, 100),
                metal: isPercent ? getValue('Metal') : Math.min(getValue('Metal') * 20, 100),
                water: isPercent ? getValue('Water') : Math.min(getValue('Water') * 20, 100),
            };
        }
        // 사주 정보 없으면 균등 분포
        return { wood: 20, fire: 20, earth: 20, metal: 20, water: 20 };
    }

    /**
     * 이름 오행 그래프 (0-100%)
     */
    private getNameElementGraph(input: ReportInput): ElementGraph {
        const counts: Record<string, number> = {
            Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0,
        };

        // 성씨 오행 (한글 성씨로 조회, 한자가 있으면 해당 variant 사용)
        const surnameVariant = this.getSurnameVariant(input.surname, input.surnameHanja);
        if (surnameVariant?.element) {
            counts[surnameVariant.element] = (counts[surnameVariant.element] || 0) + 1;
        }

        // 이름 오행
        for (const hanja of input.givenNameHanja) {
            const entry = this.hanjaMap.get(hanja);
            if (entry?.element) {
                counts[entry.element] = (counts[entry.element] || 0) + 1;
            }
        }

        return this.normalizeToGraph(counts);
    }

    /**
     * 카운트를 0-100% 그래프로 변환
     * 1 = 20%, 5 이상 = 100%
     */
    private normalizeToGraph(counts: Record<string, number>): ElementGraph {
        const graph: ElementGraph = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };

        for (const key of ELEMENT_KEYS) {
            const count = counts[key] || 0;
            // 1 count = 20%, max 100%
            graph[key.toLowerCase() as keyof ElementGraph] = Math.min(count * 20, 100);
        }

        return graph;
    }

    /**
     * 이름이 가진 오행 찾기 (그래프에 "이름" 박스 표시용)
     * 이름에 해당 오행이 있으면 UI에 표시
     */
    private findFilledElements(
        _saju: ElementGraph,
        name: ElementGraph,
        _yongsin?: string[]
    ): string[] {
        const filled: string[] = [];

        for (const key of ELEMENT_KEYS) {
            const nameValue = name[key.toLowerCase() as keyof ElementGraph];

            // 이름에 해당 오행이 있으면 표시
            if (nameValue > 0) {
                filled.push(key);
            }
        }

        return filled;
    }

    /**
     * 요약 생성
     * - 사주에서 부족한 오행(0개) 언급
     * - 이름이 채워주는 오행 언급
     */
    private generateSummary(
        saju: ElementGraph,
        filledElements: string[],
        _nameElements: ElementGraph
    ): string {
        // 사주에서 진짜 부족한 오행 (0개인 것)
        const deficientElements: string[] = [];
        for (const key of ELEMENT_KEYS) {
            const sajuValue = saju[key.toLowerCase() as keyof ElementGraph];
            if (sajuValue === 0) {
                deficientElements.push(key);
            }
        }
        console.log('[NaturalElementAnalyzer] saju values:', saju);
        console.log('[NaturalElementAnalyzer] deficientElements:', deficientElements);

        // 이름이 채워주는 오행 중 부족한 오행
        const filledDeficient = filledElements.filter(e => deficientElements.includes(e));
        // 이름이 채워주는 오행 중 부족하지 않은 오행 (보강)
        const filledExtra = filledElements.filter(e => !deficientElements.includes(e));
        // 부족하지만 이름이 안 채워주는 오행
        const unfilledDeficient = deficientElements.filter(e => !filledElements.includes(e));

        const deficientKorean = deficientElements.map(e => ELEMENT_KOREAN[e]);
        const filledDeficientKorean = filledDeficient.map(e => ELEMENT_KOREAN[e]);
        const filledExtraKorean = filledExtra.map(e => ELEMENT_KOREAN[e]);
        const unfilledDeficientKorean = unfilledDeficient.map(e => ELEMENT_KOREAN[e]);

        // 케이스별 요약 생성
        if (deficientElements.length === 0) {
            // 부족한 오행 없음
            if (filledElements.length > 0) {
                return `이름이 ${filledExtraKorean.join(', ')}의 기운을 더해 사주와 조화를 이루고 있어요.`;
            }
            return '이름의 오행이 사주와 조화를 이루고 있습니다.';
        }

        if (filledDeficient.length > 0 && unfilledDeficient.length === 0) {
            // 부족한 오행을 이름이 모두 채워줌
            return `사주에 부족한 ${filledDeficientKorean.join('과 ')}의 기운을 이름이 채워주고 있어요.`;
        }

        if (filledDeficient.length > 0 && unfilledDeficient.length > 0) {
            // 부족한 오행 중 일부만 채워줌
            return `사주에 ${deficientKorean.join(', ')}이 부족한데, 이름이 ${filledDeficientKorean.join('과 ')}의 기운을 채워주고 있어요.`;
        }

        // 부족한 오행이 있지만 이름이 안 채워줌
        return `사주에 ${unfilledDeficientKorean.join('과 ')}의 기운이 부족해요. 이름은 다른 오행을 보강하고 있습니다.`;
    }

    /**
     * 사주 없을 때 요약 생성
     */
    private generateNoSajuSummary(nameElements: ElementGraph): string {
        // 가장 강한 오행 찾기
        const entries = Object.entries(nameElements) as [keyof ElementGraph, number][];
        const dominant = entries.reduce((a, b) => a[1] > b[1] ? a : b);

        const elementKey = dominant[0].charAt(0).toUpperCase() + dominant[0].slice(1);
        const elementKorean = ELEMENT_KOREAN[elementKey] || elementKey;

        return `이 이름은 ${elementKorean}의 기운이 강해요. 사주 정보를 입력하시면 더 정확한 분석이 가능합니다.`;
    }

    /**
     * 이름에서 강한 오행 목록 찾기 (20% 이상)
     */
    private findDominantElements(nameElements: ElementGraph): string[] {
        const dominant: string[] = [];

        for (const key of ELEMENT_KEYS) {
            const value = nameElements[key.toLowerCase() as keyof ElementGraph];
            if (value >= 20) {
                dominant.push(key);
            }
        }

        return dominant;
    }
}
