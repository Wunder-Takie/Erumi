/**
 * Erumi Report Engine - Main Report Generator
 * 전체 리포트 생성 오케스트레이터
 */

import type {
    ReportInput,
    NameReport,
    HeaderSection,
    SummarySection,
    CarouselCard,
    AnalysisTabs,
} from './types';

import { YinYangAnalyzer } from './analyzers/YinYangAnalyzer';
import { PronunciationAnalyzer } from './analyzers/PronunciationAnalyzer';
import { NumerologyAnalyzer } from './analyzers/NumerologyAnalyzer';
import { NaturalElementAnalyzer } from './analyzers/NaturalElementAnalyzer';
import { ForbiddenCharAnalyzer } from './analyzers/ForbiddenCharAnalyzer';
import { generateReportContent, type HanjaInfo, type AnalysisData } from './ReportLLMGenerator';

import hanjaDb from '../data/core/hanja_db.json' with { type: 'json' };
import surnames from '../data/core/surnames.json' with { type: 'json' };

interface HanjaEntry {
    hanja: string;
    hangul: string;
    hun: string;
    eum: string;
    meaning_story?: string;
    strokes: number;
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

// ============================================
// Report Generator Class
// ============================================

export class ReportGenerator {
    private yinYangAnalyzer: YinYangAnalyzer;
    private pronunciationAnalyzer: PronunciationAnalyzer;
    private numerologyAnalyzer: NumerologyAnalyzer;
    private naturalElementAnalyzer: NaturalElementAnalyzer;
    private forbiddenCharAnalyzer: ForbiddenCharAnalyzer;
    private hanjaMap: Map<string, HanjaEntry>;
    private surnamesData: SurnamesData;

    constructor() {
        this.yinYangAnalyzer = new YinYangAnalyzer();
        this.pronunciationAnalyzer = new PronunciationAnalyzer();
        this.numerologyAnalyzer = new NumerologyAnalyzer();
        this.naturalElementAnalyzer = new NaturalElementAnalyzer();
        this.forbiddenCharAnalyzer = new ForbiddenCharAnalyzer();
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
     * 전체 리포트 생성
     */
    async generate(input: ReportInput): Promise<NameReport> {
        // 1. Header 생성
        const header = await this.generateHeader(input);

        // 2. Analysis 탭 생성 (계산 기반)
        const analysis = await this.generateAnalysis(input);

        // 3. 한자 정보 수집
        const hanjaInfoList = this.collectHanjaInfo(input);

        // 4. 분석 데이터 변환 (LLM용)
        const analysisData = this.convertToAnalysisData(analysis, input);

        // 5. LLM으로 콘텐츠 생성 (Summary, Carousel, 탭 요약)
        const llmContent = await generateReportContent(input, hanjaInfoList, analysisData);

        // 6. LLM 생성 요약을 Analysis 탭에 적용
        const enhancedAnalysis = this.applyLLMComments(analysis, llmContent.analysisComments);

        return {
            header,
            summary: { text: llmContent.summary },
            carousel: llmContent.carousel,
            analysis: enhancedAnalysis,
            nameImpressions: llmContent.nameImpressions,
            nameInterpretations: llmContent.nameInterpretations,
            generatedAt: new Date(),
            version: '1.0.0',
        };
    }

    /**
     * 한자 정보 수집
     */
    private collectHanjaInfo(input: ReportInput): HanjaInfo[] {
        return input.givenNameHanja.map((hanja, i) => {
            const entry = this.hanjaMap.get(hanja);
            return {
                hanja,
                hangul: input.givenName[i],
                hun: entry?.hun || hanja,
                meaning_story: entry?.meaning_story,
                element: entry?.element,
            };
        });
    }

    /**
     * Analysis를 LLM용 데이터로 변환
     */
    private convertToAnalysisData(analysis: AnalysisTabs, input: ReportInput): AnalysisData {
        // 사주 오행 개수 추출 (elementCounts가 있으면 직접 사용)
        let sajuCounts: { wood: number; fire: number; earth: number; metal: number; water: number } | undefined;

        if (input.saju?.elementCounts) {
            // 직접 개수 사용 (권장)
            const cts = input.saju.elementCounts;
            const getValue = (key: string): number => {
                const pascal = key.charAt(0).toUpperCase() + key.slice(1);
                return cts[pascal] ?? cts[key.toLowerCase()] ?? 0;
            };
            sajuCounts = {
                wood: getValue('Wood'),
                fire: getValue('Fire'),
                earth: getValue('Earth'),
                metal: getValue('Metal'),
                water: getValue('Water'),
            };
        } else if (input.saju?.elements) {
            // 퍼센트에서 역산 (fallback)
            const els = input.saju.elements;
            const getValue = (key: string): number => {
                const pascal = key.charAt(0).toUpperCase() + key.slice(1);
                return els[pascal] ?? els[key.toLowerCase()] ?? 0;
            };
            const total = Object.values(els).reduce((a, b) => (a as number) + (b as number), 0) as number;
            const isPercent = total >= 95 && total <= 105;

            sajuCounts = {
                wood: isPercent ? Math.round(getValue('Wood') / 12.5) : getValue('Wood'),
                fire: isPercent ? Math.round(getValue('Fire') / 12.5) : getValue('Fire'),
                earth: isPercent ? Math.round(getValue('Earth') / 12.5) : getValue('Earth'),
                metal: isPercent ? Math.round(getValue('Metal') / 12.5) : getValue('Metal'),
                water: isPercent ? Math.round(getValue('Water') / 12.5) : getValue('Water'),
            };
        }

        // 사주에서 부족한 오행 (0개인 것) 찾기
        const missingElements: string[] = [];
        const elementNames = { wood: '목', fire: '화', earth: '토', metal: '금', water: '수' };
        if (sajuCounts) {
            console.log('[ReportGenerator] sajuCounts:', sajuCounts);
            for (const [key, value] of Object.entries(sajuCounts)) {
                if (value === 0) {
                    missingElements.push(elementNames[key as keyof typeof elementNames] || key);
                }
            }
            console.log('[ReportGenerator] missingElements:', missingElements);
        } else {
            console.log('[ReportGenerator] sajuCounts is undefined!');
        }

        // 🆕 사주 음양 계산 (오행 기반)
        // 목/화 = 양의 기운, 금/수 = 음의 기운, 토 = 중성
        let sajuYinYang: { dominant: 'yin' | 'yang' | 'balanced'; description: string } | undefined;
        if (sajuCounts) {
            const yangElements = sajuCounts.wood + sajuCounts.fire;  // 목+화 = 양
            const yinElements = sajuCounts.metal + sajuCounts.water;  // 금+수 = 음
            const total = yangElements + yinElements;  // 토는 중성이므로 제외

            if (total > 0) {
                const yangRatio = yangElements / total;

                // 표현 다양성을 위한 변형들
                const yangDescriptions = [
                    '양(陽)의 기운이 강한 사주',
                    '활발한 양(陽) 기운을 타고난 사주',
                    '밝고 역동적인 양 기운의 사주',
                    '양의 기운이 넘치는 사주',
                ];
                const yinDescriptions = [
                    '음(陰)의 기운이 강한 사주',
                    '차분한 음(陰) 기운을 타고난 사주',
                    '깊고 안정적인 음 기운의 사주',
                    '음의 기운이 깊은 사주',
                ];
                const balancedDescriptions = [
                    '음양이 균형 잡힌 사주',
                    '음과 양이 조화로운 사주',
                    '균형 잡힌 음양의 사주',
                    '음양의 조화가 이루어진 사주',
                ];

                const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

                if (yangRatio > 0.6) {
                    sajuYinYang = {
                        dominant: 'yang',
                        description: pickRandom(yangDescriptions),
                    };
                } else if (yangRatio < 0.4) {
                    sajuYinYang = {
                        dominant: 'yin',
                        description: pickRandom(yinDescriptions),
                    };
                } else {
                    sajuYinYang = {
                        dominant: 'balanced',
                        description: pickRandom(balancedDescriptions),
                    };
                }
                console.log('[ReportGenerator] sajuYinYang:', sajuYinYang);
            }
        }

        return {
            yinYang: {
                isBalanced: analysis.yinYang.isBalanced,
                yinCount: analysis.yinYang.characters.filter(c => c.type === '음').length,
                yangCount: analysis.yinYang.characters.filter(c => c.type === '양').length,
            },
            sajuYinYang,  // 🆕 사주 음양 정보 추가
            pronunciation: {
                flow: analysis.pronunciation.flow || '중립',
                elements: analysis.pronunciation.characters.map(c => c.elementKorean),
                hangulChars: analysis.pronunciation.characters.map(c => ({
                    hangul: c.hangul,
                    element: c.elementKorean,
                })),
            },
            numerology: {
                scores: analysis.numerology.periods.map(p => ({
                    name: p.name,
                    level: p.level,
                    ageRange: p.ageRange,
                    suriNumber: p.suriNumber,
                    interpretation: p.interpretation,
                })),
            },
            naturalElement: {
                nameElements: {
                    wood: analysis.naturalElement.nameElements.wood,
                    fire: analysis.naturalElement.nameElements.fire,
                    earth: analysis.naturalElement.nameElements.earth,
                    metal: analysis.naturalElement.nameElements.metal,
                    water: analysis.naturalElement.nameElements.water,
                },
                filled: analysis.naturalElement.filledElements,
                missing: missingElements.length > 0 ? missingElements : undefined,
                sajuCounts,
            },
            forbiddenChar: {
                hasIssue: analysis.forbiddenChar.characters.some(c => c.status !== 'good'),
                issues: analysis.forbiddenChar.characters
                    .filter(c => c.status !== 'good')
                    .map(c => c.reason),
                allGood: analysis.forbiddenChar.characters.every(c => c.status === 'good'),
                characters: analysis.forbiddenChar.characters,  // UI 바인딩용
            },
        };
    }

    /**
     * LLM 생성 요약을 Analysis 탭에 적용
     */
    private applyLLMComments(
        analysis: AnalysisTabs,
        comments: { yinYang: string; pronunciation: string; numerologySummary: string; numerology: string; naturalElement: string; forbiddenChar: string }
    ): AnalysisTabs {
        // 수리성명학: LLM 응답에서 각 시기별 해석 파싱, 전체 요약은 numerologySummary 사용
        const enhancedNumerology = this.enhanceNumerologyWithLLM(
            analysis.numerology,
            comments.numerology,
            comments.numerologySummary
        );

        return {
            yinYang: { ...analysis.yinYang, summary: comments.yinYang },
            pronunciation: { ...analysis.pronunciation, summary: comments.pronunciation },
            numerology: enhancedNumerology,
            naturalElement: { ...analysis.naturalElement, summary: comments.naturalElement },
            forbiddenChar: { ...analysis.forbiddenChar, summary: comments.forbiddenChar },
        };
    }

    /**
     * LLM 수리성명학 해석을 periods에 적용
     */
    private enhanceNumerologyWithLLM(
        numerology: AnalysisTabs['numerology'],
        llmNumerology: string,
        llmNumerologySummary: string
    ): AnalysisTabs['numerology'] {
        // LLM 응답을 시기별로 파싱 (초년운: ...\n청년운: ... 형식)
        const parsedInterpretations: Record<string, string> = {};

        // 줄바꿈으로 분리 (실제 \n과 이스케이프된 \\n 모두 처리)
        const lines = llmNumerology.split(/\\n|\n/).filter(l => l.trim());

        for (const line of lines) {
            // "초년운: ..." 형식 파싱 (초년운/청년운/중년운/말년운 지원)
            const match = line.match(/^(초년운|청년운|중년운|말년운)[^:]*:\s*(.+)$/);
            if (match) {
                parsedInterpretations[match[1]] = match[2].trim();
            }
        }

        // periods에 LLM 해석 적용
        // period.name은 '초년', '청년', '중년', '말년' 형식
        // LLM 키는 '초년운', '청년운', '중년운', '말년운' 형식
        const enhancedPeriods = numerology.periods.map(period => {
            const llmKey = period.name + '운';
            const llmInterpretation = parsedInterpretations[llmKey];
            return {
                ...period,
                interpretation: llmInterpretation || period.interpretation,
            };
        });

        return {
            ...numerology,
            periods: enhancedPeriods,
            summary: llmNumerologySummary,  // 전체 요약 사용
        };
    }

    /**
     * Header 섹션 생성
     */
    private async generateHeader(input: ReportInput): Promise<HeaderSection> {
        const characters = [];

        // 성씨 추가
        characters.push({
            hanja: input.surnameHanja,
            hangul: input.surname,
            meaning: this.lookupMeaning(input.surname, input.surnameHanja, true),
            strokes: this.getStrokes(input.surname, input.surnameHanja, true),
            element: this.getElement(input.surname, input.surnameHanja, true),
        });

        // 이름 글자 추가
        for (let i = 0; i < input.givenNameHanja.length; i++) {
            characters.push({
                hanja: input.givenNameHanja[i],
                hangul: input.givenName[i],
                meaning: this.lookupMeaning('', input.givenNameHanja[i], false),
                strokes: this.getStrokes('', input.givenNameHanja[i], false),
                element: this.getElement('', input.givenNameHanja[i], false),
            });
        }

        return { characters };
    }

    /**
     * Analysis 탭 전체 생성
     */
    private async generateAnalysis(input: ReportInput): Promise<AnalysisTabs> {
        const [yinYang, pronunciation, numerology, naturalElement, forbiddenChar] = await Promise.all([
            this.yinYangAnalyzer.analyze(input),
            this.pronunciationAnalyzer.analyze(input),
            this.numerologyAnalyzer.analyze(input),
            this.naturalElementAnalyzer.analyze(input),
            this.forbiddenCharAnalyzer.analyze(input),
        ]);

        return {
            yinYang,
            pronunciation,
            numerology,
            naturalElement,
            forbiddenChar,
        };
    }

    /**
     * Summary 생성 (LLM 연동 - Phase 4)
     */
    private async generateSummary(input: ReportInput, analysis: AnalysisTabs): Promise<SummarySection> {
        // 템플릿 기반 생성 (LLM 연동 전까지)
        const names = input.givenName.join('');
        const meanings = input.givenNameHanja.map(h => {
            const entry = this.hanjaMap.get(h);
            return entry?.hun ? `${entry.hun} ${entry.eum}` : h;
        });

        // 간단한 스토리 생성
        const meaningText = meanings.join('과 ');
        const yinYangSummary = analysis.yinYang.isBalanced ? '균형 잡힌' : '개성 있는';

        return {
            text: `${meaningText}의 의미를 담은 ${yinYangSummary} 이름이에요. ${names}은(는) 밝고 아름다운 미래를 향해 나아갈 것입니다.`,
        };
    }

    /**
     * Carousel 카드 생성 (LLM 연동 - Phase 4)
     */
    private async generateCarousel(input: ReportInput, _analysis: AnalysisTabs): Promise<CarouselCard[]> {
        // 1. 글자별 의미 카드
        const meaningCard: CarouselCard = {
            type: 'meaning',
            title: '글자별 의미',
            characters: input.givenNameHanja.map((hanja, i) => {
                const entry = this.hanjaMap.get(hanja);
                return {
                    hanja,
                    meaning: entry?.hun ? `${entry.hun} ${entry.eum}` : `${input.givenName[i]}`,
                    story: entry?.meaning_story || `${input.givenName[i]}의 깊은 의미를 담고 있습니다.`,
                };
            }),
        };

        // 2. 이름의 기운 카드 (두 글자 조합 해석)
        const entries = input.givenNameHanja.map(h => this.hanjaMap.get(h));
        const energyTitle = this.generateEnergyTitle(entries);
        const energyContent = this.generateEnergyContent(input, entries);

        const energyCard: CarouselCard = {
            type: 'energy',
            title: energyTitle,
            content: energyContent,
        };

        // 3. 축복 메시지 카드
        const blessingTitle = this.generateBlessingTitle(entries);
        const blessingContent = this.generateBlessingContent(input, entries);

        const blessingCard: CarouselCard = {
            type: 'blessing',
            title: blessingTitle,
            content: blessingContent,
        };

        return [meaningCard, energyCard, blessingCard];
    }

    /**
     * 이름의 기운 제목 생성
     */
    private generateEnergyTitle(entries: (HanjaEntry | undefined)[]): string {
        // 첫 글자와 두 번째 글자의 핵심 특성 추출
        const traits: string[] = [];

        entries.forEach(entry => {
            if (entry?.hun) {
                const hun = entry.hun;
                // "밝을 랑" → "밝은", "시 시" → "시적인" 등 변환
                if (hun.includes('밝을')) traits.push('맑은 목소리');
                else if (hun.includes('시')) traits.push('뛰어난 표현력');
                else if (hun.includes('현')) traits.push('현명한 지혜');
                else if (hun.includes('지')) traits.push('깊은 지혜');
                else if (hun.includes('준')) traits.push('빼어난 재능');
                else traits.push(hun);
            }
        });

        return traits.length > 1 ? `${traits[0]}와 ${traits[1]}` : traits[0] || '이름의 기운';
    }

    /**
     * 이름의 기운 본문 생성
     */
    private generateEnergyContent(input: ReportInput, entries: (HanjaEntry | undefined)[]): string {
        const names = input.givenName.join('');

        if (entries.length >= 2 && entries[0] && entries[1]) {
            const first = entries[0];
            const second = entries[1];
            return `${second.hun || ''}(${second.hanja})와 ${first.hun || ''}(${first.hanja})을 겸비하여, 자신의 뜻을 세상에 명확하고 조리 있게 전달하는 리더나 예술가로 성장하라는 뜻이에요.`;
        }

        return `${names}은(는) 뛰어난 재능과 밝은 기운을 가진 이름입니다.`;
    }

    /**
     * 축복 제목 생성
     */
    private generateBlessingTitle(entries: (HanjaEntry | undefined)[]): string {
        const traits: string[] = [];

        entries.forEach(entry => {
            if (entry?.hun) {
                const hun = entry.hun;
                if (hun.includes('밝을')) traits.push('명랑하고 구김살 없는');
                else if (hun.includes('시')) traits.push('예술가');
                else if (hun.includes('현')) traits.push('현명한 지도자');
                else if (hun.includes('지')) traits.push('지혜로운');
                else if (hun.includes('준')) traits.push('뛰어난 리더');
            }
        });

        if (traits.includes('명랑하고 구김살 없는') && traits.includes('예술가')) {
            return '명랑하고 구김살 없는 예술가';
        }

        return traits.join(' ') || '밝은 미래로의 축복';
    }

    /**
     * 축복 본문 생성
     */
    private generateBlessingContent(input: ReportInput, entries: (HanjaEntry | undefined)[]): string {
        const hasBright = entries.some(e => e?.hun?.includes('밝을'));
        const hasPoetic = entries.some(e => e?.hun?.includes('시'));

        if (hasBright && hasPoetic) {
            return '섬세한 재능을 지녔으면서도 예민함 대신, 구김살 없이 밝고 명랑한 에너지로 주변에 즐거움을 주는 사람이 되라는 축복을 담고 있어요.';
        }

        if (hasBright) {
            return '달빛처럼 환하고 밝은 성격으로, 어디서든 주변을 환하게 밝히는 사람이 되라는 축복을 담고 있어요.';
        }

        if (hasPoetic) {
            return '깊은 감수성과 아름다운 표현력으로, 세상에 감동을 전하는 사람이 되라는 축복을 담고 있어요.';
        }

        const names = input.givenName.join('');
        return `${names}이(가) 행복하고 밝은 미래를 향해 나아가길 기원합니다.`;
    }

    // ============================================
    // Helper Methods
    // ============================================

    /**
     * 한자 음훈 조회
     */
    private lookupMeaning(hangul: string, hanja: string, isSurname: boolean): string {
        if (isSurname) {
            const variant = this.getSurnameVariant(hangul, hanja);
            if (variant) return `${variant.hun} ${variant.eum}`;
        }
        const entry = this.hanjaMap.get(hanja);
        return entry?.hun ? `${entry.hun} ${entry.eum}` : `${hanja}`;
    }

    /**
     * 한자 획수 조회
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
     * 한자 오행 조회
     */
    private getElement(hangul: string, hanja: string, isSurname: boolean): string {
        if (isSurname) {
            const variant = this.getSurnameVariant(hangul, hanja);
            if (variant) return variant.element;
        }
        const entry = this.hanjaMap.get(hanja);
        return entry?.element ?? 'Earth';
    }
}

// ============================================
// Convenience Function
// ============================================

/**
 * 리포트 생성 편의 함수
 */
export async function generateReport(input: ReportInput): Promise<NameReport> {
    const generator = new ReportGenerator();
    return generator.generate(input);
}
