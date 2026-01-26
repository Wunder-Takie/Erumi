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

interface SurnameEntry {
    hanja: string;
    strokes: number;
    hangul?: string;
}

export class NumerologyAnalyzer {
    private hanjaMap: Map<string, HanjaEntry>;
    private surnameMap: Map<string, SurnameEntry>;
    private surnameHangulMap: Map<string, SurnameEntry>;

    constructor() {
        this.hanjaMap = new Map(
            (hanjaDb as HanjaEntry[]).map(h => [h.hanja, h])
        );
        this.surnameMap = new Map(
            (surnames as SurnameEntry[]).map(s => [s.hanja, s])
        );
        this.surnameHangulMap = new Map(
            (surnames as SurnameEntry[]).map(s => [s.hangul || '', s])
        );
    }

    /**
     * 수리성명학 분석 - suriUtils.ts와 동일한 획수 조합 사용
     * 표시: 초년/청년/중년/말년
     * 계산: suriUtils의 초년운/중년운/말년운/총운과 동일
     */
    async analyze(input: ReportInput): Promise<NumerologyResult> {
        // 획수 계산
        const surnameStrokes = this.getStrokes(input.surnameHanja, true);
        const strokes1 = input.givenNameHanja[0] ? this.getStrokes(input.givenNameHanja[0], false) : 0;
        const strokes2 = input.givenNameHanja[1] ? this.getStrokes(input.givenNameHanja[1], false) : 0;

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
    private getStrokes(hanja: string, isSurname: boolean): number {
        if (isSurname) {
            // 한자로 먼저 조회
            const entry = this.surnameMap.get(hanja);
            if (entry) return entry.strokes;
            // 한글로 조회 시도
            const hangulEntry = this.surnameHangulMap.get(hanja);
            if (hangulEntry) return hangulEntry.strokes;
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

        // suriUtils.ts의 getSuriInfo 함수 사용
        const suriInfo = getSuriInfo(normalized);

        let level: '대길' | '길' | '반길반흉' | '흉';
        let interpretation: string;

        if (suriInfo) {
            level = suriInfo.level as '대길' | '길' | '반길반흉' | '흉';
            interpretation = suriInfo.desc;
        } else {
            // 길수 목록에 없는 숫자 = 흉 또는 반길반흉
            level = this.determineNonLuckyLevel(normalized);
            interpretation = this.generateNonLuckyInterpretation(name, level);
        }

        return {
            name,
            level,
            ageRange,
            suriNumber: normalized,
            interpretation,
        };
    }

    /**
     * 비길수 레벨 판정
     */
    private determineNonLuckyLevel(count: number): '반길반흉' | '흉' {
        // 특히 나쁜 수: 2, 4, 9, 10, 12, 14, 19, 20, 22, 26, 28, 34, 36, 44, 46, 54, 59, 64, 66, 69, 74, 76, 79
        const badNumbers = [2, 4, 9, 10, 12, 14, 19, 20, 22, 26, 28, 34, 36, 44, 46, 54, 59, 64, 66, 69, 74, 76, 79];
        return badNumbers.includes(count) ? '흉' : '반길반흉';
    }

    /**
     * 비길수 해석 생성
     */
    private generateNonLuckyInterpretation(name: string, level: '반길반흉' | '흉'): string {
        if (level === '흉') {
            const interpretations: Record<string, string> = {
                '초년': '어린 시절 어려움이 있을 수 있으나 이를 극복하면 더 강해집니다.',
                '청년': '청년기에 시련이 있을 수 있으나 성장의 밑거름이 됩니다.',
                '중년': '중년에 도전이 있을 수 있으나 지혜로 극복할 수 있습니다.',
                '말년': '노후에 건강 관리에 신경 쓰면 편안한 말년을 보낼 수 있습니다.',
            };
            return interpretations[name] || '노력으로 극복할 수 있습니다.';
        }
        return '평범하지만 안정적인 시기입니다.';
    }
}

