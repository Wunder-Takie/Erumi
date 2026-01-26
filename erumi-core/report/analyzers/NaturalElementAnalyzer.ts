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

interface SurnameEntry {
    hanja: string;
    element: string;
}

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
    private surnameMap: Map<string, SurnameEntry>;

    constructor() {
        this.hanjaMap = new Map(
            (hanjaDb as HanjaEntry[]).map(h => [h.hanja, h])
        );
        this.surnameMap = new Map(
            (surnames as SurnameEntry[]).map(s => [s.hanja, s])
        );
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

        // 채워주는 오행 목록 (사주 없으면 빈 배열)
        const filledElements = hasSaju && sajuElements
            ? this.findFilledElements(sajuElements, nameElements)
            : [];

        // 요약 생성
        const summary = hasSaju
            ? this.generateSummary(filledElements, nameElements)
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
     */
    private getSajuElementGraph(input: ReportInput): ElementGraph {
        if (input.saju?.elements) {
            return this.normalizeToGraph(input.saju.elements);
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

        // 성씨 오행
        const surnameEntry = this.surnameMap.get(input.surnameHanja);
        if (surnameEntry?.element) {
            counts[surnameEntry.element] = (counts[surnameEntry.element] || 0) + 1;
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
     * 사주에서 부족한데 이름이 채워주는 오행 찾기
     */
    private findFilledElements(saju: ElementGraph, name: ElementGraph): string[] {
        const filled: string[] = [];

        for (const key of ELEMENT_KEYS) {
            const sajuValue = saju[key.toLowerCase() as keyof ElementGraph];
            const nameValue = name[key.toLowerCase() as keyof ElementGraph];

            // 사주에서 부족하고(40% 미만) 이름에서 채워주면(20% 이상)
            if (sajuValue < 40 && nameValue >= 20) {
                filled.push(key);
            }
        }

        return filled;
    }

    /**
     * 요약 생성
     */
    private generateSummary(filledElements: string[], _nameElements: ElementGraph): string {
        if (filledElements.length === 0) {
            return '이름의 오행이 사주와 조화를 이루고 있습니다.';
        }

        const filledKorean = filledElements.map(e => ELEMENT_KOREAN[e]).join('과 ');

        if (filledElements.length === 1) {
            return `사주에 필요한 ${filledKorean}의 에너지를 이름이 채워주고 있어요.`;
        }

        return `사주에 필요한 ${filledKorean}의 에너지를 이름이 완벽하게 채워주고 있어요.`;
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
}
