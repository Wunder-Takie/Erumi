/**
 * Erumi Report Engine - Yin Yang Analyzer
 * 음양오행 분석 (획수 기반)
 */

import type { ReportInput, YinYangResult, YinYangCharacter } from '../types';
import hanjaDb from '../../data/core/hanja_db.json' with { type: 'json' };
import surnames from '../../data/core/surnames.json' with { type: 'json' };

interface HanjaEntry {
    hanja: string;
    hangul: string;
    meaning_korean: string;
    strokes: number;
    element?: string;
}

interface SurnameEntry {
    hangul: string;
    hanja: string;
    strokes: number;
    element: string;
}

export class YinYangAnalyzer {
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
     * 음양오행 분석
     */
    async analyze(input: ReportInput): Promise<YinYangResult> {
        const characters: YinYangCharacter[] = [];

        // 성씨 분석
        const surnameStrokes = this.getStrokes(input.surnameHanja, true);
        characters.push({
            hanja: input.surnameHanja,
            meaning: this.getMeaning(input.surnameHanja, true),
            strokes: surnameStrokes,
            isOdd: surnameStrokes % 2 === 1,
            type: surnameStrokes % 2 === 1 ? '양' : '음',
        });

        // 이름 글자 분석
        for (const hanja of input.givenNameHanja) {
            const strokes = this.getStrokes(hanja, false);
            characters.push({
                hanja,
                meaning: this.getMeaning(hanja, false),
                strokes,
                isOdd: strokes % 2 === 1,
                type: strokes % 2 === 1 ? '양' : '음',
            });
        }

        // 균형 평가
        const yinCount = characters.filter(c => c.type === '음').length;
        const yangCount = characters.filter(c => c.type === '양').length;
        const isBalanced = yinCount > 0 && yangCount > 0;

        // 요약 생성
        const summary = this.generateSummary(yinCount, yangCount, isBalanced);

        return {
            description: '글자 획수의 짝수(음)와 홀수(양)를 적절히 섞어 기운의 균형을 맞추는 거에요.',
            characters,
            summary,
            isBalanced,
        };
    }

    /**
     * 획수 조회
     */
    private getStrokes(hanja: string, isSurname: boolean): number {
        if (isSurname) {
            const entry = this.surnameMap.get(hanja);
            if (entry) return entry.strokes;
        }
        const entry = this.hanjaMap.get(hanja);
        return entry?.strokes ?? 10;
    }

    /**
     * 음훈 조회
     */
    private getMeaning(hanja: string, isSurname: boolean): string {
        if (isSurname) {
            const entry = this.surnameMap.get(hanja);
            if (entry) return `${entry.hangul} ${entry.hangul}`;
        }
        const entry = this.hanjaMap.get(hanja);
        return entry?.meaning_korean ?? `${hanja}`;
    }

    /**
     * 요약 생성
     */
    private generateSummary(yinCount: number, yangCount: number, isBalanced: boolean): string {
        if (isBalanced) {
            if (yinCount === yangCount) {
                return "차분한 '음'과 활발한 '양'이 완벽히 균형을 이루고 있어 이상적인 이름이에요.";
            }
            return "차분한 '음'과 활발한 '양'이 골고루 섞여 있어 균형이 좋은 이름이에요.";
        }
        if (yangCount === 0) {
            return "'음'의 기운만 있어 차분하지만, '양'의 활기를 더하면 더 좋아요.";
        }
        return "'양'의 기운만 있어 활발하지만, '음'의 안정감을 더하면 더 좋아요.";
    }
}
