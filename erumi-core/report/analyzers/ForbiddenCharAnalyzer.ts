/**
 * Erumi Report Engine - Forbidden Character Analyzer
 * 불용문자 분석
 */

import type { ReportInput, ForbiddenCharResult } from '../types';
import hanjaDb from '../../data/core/hanja_db.json' with { type: 'json' };

interface HanjaEntry {
    hanja: string;
    hangul: string;
    meaning_korean: string;
}

// 불용문자 목록 (하드코딩 - 나중에 JSON으로 분리 가능)
const FORBIDDEN_CHARACTERS: Record<string, { reason: string; status: 'caution' | 'forbidden' }> = {
    // 흉한 의미
    '死': { reason: '죽을 사 - 불길한 의미', status: 'forbidden' },
    '病': { reason: '병 병 - 질병을 연상', status: 'forbidden' },
    '亡': { reason: '망할 망 - 부정적 의미', status: 'forbidden' },
    '災': { reason: '재앙 재 - 재난을 연상', status: 'forbidden' },
    '殺': { reason: '죽일 살 - 폭력적 의미', status: 'forbidden' },
    '毒': { reason: '독 독 - 해로운 의미', status: 'forbidden' },
    '鬼': { reason: '귀신 귀 - 부정적 연상', status: 'forbidden' },
    '魔': { reason: '마귀 마 - 부정적 연상', status: 'forbidden' },

    // 주의 필요
    '寒': { reason: '찰 한 - 차가운 느낌', status: 'caution' },
    '冷': { reason: '찰 냉 - 냉정한 느낌', status: 'caution' },
    '憂': { reason: '근심 우 - 걱정을 연상', status: 'caution' },
    '悲': { reason: '슬플 비 - 슬픔을 연상', status: 'caution' },
    '苦': { reason: '괴로울 고 - 고통을 연상', status: 'caution' },
    '暗': { reason: '어두울 암 - 어두운 느낌', status: 'caution' },
    '末': { reason: '끝 말 - 끝을 연상', status: 'caution' },
    '孤': { reason: '외로울 고 - 외로움을 연상', status: 'caution' },
    '貧': { reason: '가난할 빈 - 빈곤을 연상', status: 'caution' },
};

export class ForbiddenCharAnalyzer {
    private hanjaMap: Map<string, HanjaEntry>;

    constructor() {
        this.hanjaMap = new Map(
            (hanjaDb as HanjaEntry[]).map(h => [h.hanja, h])
        );
    }

    /**
     * 불용문자 분석
     */
    async analyze(input: ReportInput): Promise<ForbiddenCharResult> {
        const characters: ForbiddenCharResult['characters'] = [];

        // 성씨는 보통 체크하지 않음 (이름 글자만)
        for (const hanja of input.givenNameHanja) {
            const forbidden = FORBIDDEN_CHARACTERS[hanja];
            const hanjaInfo = this.hanjaMap.get(hanja);

            if (forbidden) {
                characters.push({
                    hanja,
                    status: forbidden.status,
                    reason: forbidden.reason,
                });
            } else {
                characters.push({
                    hanja,
                    status: 'good',
                    reason: hanjaInfo?.meaning_korean
                        ? `${hanjaInfo.meaning_korean} - 이름에 사용하기 좋은 한자입니다.`
                        : '이름에 사용하기 좋은 한자입니다.',
                });
            }
        }

        // 요약 생성
        const summary = this.generateSummary(characters);

        return {
            characters,
            summary,
        };
    }

    /**
     * 요약 생성
     */
    private generateSummary(characters: ForbiddenCharResult['characters']): string {
        const forbiddenCount = characters.filter(c => c.status === 'forbidden').length;
        const cautionCount = characters.filter(c => c.status === 'caution').length;
        const goodCount = characters.filter(c => c.status === 'good').length;

        if (forbiddenCount > 0) {
            return '일부 한자에 주의가 필요합니다. 다른 한자를 고려해보세요.';
        }
        if (cautionCount > 0) {
            return '대체로 좋지만, 일부 한자는 해석에 따라 다를 수 있어요.';
        }

        const hanjaList = characters.map(c => c.hanja).join('와/과 ');
        return `${hanjaList} 모두 이름에 써도 무방하며, 현대적으로 세련된 의미를 가진 좋은 한자(길한 문자)에요.`;
    }
}
