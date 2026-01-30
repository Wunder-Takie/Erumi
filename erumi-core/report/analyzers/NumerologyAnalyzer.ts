/**
 * Erumi Report Engine - Numerology Analyzer
 * 수리성명학 분석 (초년/중년/말년/총운) - suriUtils.ts와 동일한 계산법 사용
 */

import type { ReportInput, NumerologyResult, NumerologyPeriod } from '../types';
import { getSuriInfo } from '../../naming/suriUtils';
import hanjaDb from '../../data/core/hanja_db.json' with { type: 'json' };
import surnames from '../../data/core/surnames.json' with { type: 'json' };

interface HanjaEntry {
    hanja: string;
    strokes: number;
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

export class NumerologyAnalyzer {
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
     * 수리성명학 분석 - suriUtils.ts와 동일한 획수 조합 사용
     * 표시: 초년/청년/중년/말년
     * 계산: suriUtils의 초년운/중년운/말년운/총운과 동일
     */
    async analyze(input: ReportInput): Promise<NumerologyResult> {
        // 획수 계산
        const surnameStrokes = this.getStrokes(input.surname, input.surnameHanja, true);
        const strokes1 = input.givenNameHanja[0] ? this.getStrokes('', input.givenNameHanja[0], false) : 0;
        const strokes2 = input.givenNameHanja[1] ? this.getStrokes('', input.givenNameHanja[1], false) : 0;

        // suriUtils.ts와 동일한 4격 계산
        // 초년 (= 초년운): 이름1 + 이름2
        // 청년 (= 중년운): 성 + 이름1
        // 중년 (= 말년운): 성 + 이름2
        // 말년 (= 총운): 성 + 이름1 + 이름2
        const periods: NumerologyPeriod[] = [
            this.calculatePeriod('초년', strokes1 + strokes2, '0세~19세'),
            this.calculatePeriod('청년', surnameStrokes + strokes1, '20세~39세'),
            this.calculatePeriod('중년', surnameStrokes + strokes2, '40세~59세'),
            this.calculatePeriod('말년', surnameStrokes + strokes1 + strokes2, '60세~'),
        ];

        return {
            description: '한자의 획수를 더한 숫자로 각 시기별 운세를 계산하는 거에요.',
            periods,
        };
    }

    /**
     * 획수 조회
     */
    private getStrokes(hangul: string, hanja: string, isSurname: boolean): number {
        if (isSurname) {
            const variant = this.getSurnameVariant(hangul, hanja);
            if (variant) return variant.strokes;
        }
        const entry = this.hanjaMap.get(hanja);
        return entry?.strokes ?? 10;
    }

    /**
     * 기간별 운세 계산 - suriUtils.ts의 getSuriInfo 재사용
     */
    private calculatePeriod(
        name: '초년' | '청년' | '중년' | '말년',
        suriNumber: number,
        ageRange: string
    ): NumerologyPeriod {
        // 81수리 정규화
        const normalized = suriNumber > 81 ? (suriNumber % 81 || 81) : suriNumber;

        // suriUtils.ts의 getSuriInfo 함수 사용 (suri_81.json에 81개 모두 있음)
        const suriInfo = getSuriInfo(normalized);

        // suri_81.json에 모든 숫자 있으므로 항상 찾아야 함
        const level = (suriInfo?.level || '반길반흉') as '대길' | '길' | '반길반흉' | '흉';
        const interpretation = suriInfo?.desc || '평범한 운세입니다.';

        return {
            name,
            level,
            ageRange,
            suriNumber: normalized,
            interpretation,
        };
    }
}
