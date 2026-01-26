/**
 * ReportLLMGenerator.ts
 * 리포트 콘텐츠 LLM 생성 (LLM → 캐시 → 템플릿 Fallback)
 * - 캐러셀 (글자별 의미, 이름의 기운, 축복)
 * - Summary (상단 요약)
 * - 성명학 탭 summary (5개)
 */

import { LLM_CONFIG } from '../naming/llmConfig.ts';
import type { CarouselCard, ReportInput } from './types.ts';

// ==========================================
// Types
// ==========================================

export interface HanjaInfo {
    hanja: string;
    hangul: string;
    meaning_korean: string;
    meaning_story?: string;
    element?: string;
}

export interface AnalysisData {
    yinYang: { isBalanced: boolean; yinCount: number; yangCount: number };
    pronunciation: { flow: string; elements: string[] };
    numerology: {
        scores: {
            name: string;
            level: string;
            ageRange: string;
            suriNumber: number;
            interpretation: string;
        }[]
    };
    naturalElement: { nameElements: Record<string, number>; filled?: string[] };
    forbiddenChar: { hasIssue: boolean; issues: string[] };
}

export interface LLMReportContent {
    summary: string;
    carousel: CarouselCard[];
    analysisComments: {
        yinYang: string;
        pronunciation: string;
        numerology: string;
        naturalElement: string;
        forbiddenChar: string;
    };
}

interface LLMResponseFormat {
    summary: string;
    characters: { hanja: string; meaning: string; story: string }[];
    energy: { title: string; content: string };
    blessing: { title: string; content: string };
    analysisComments: {
        yinYang: string;
        pronunciation: string;
        numerology: string;
        naturalElement: string;
        forbiddenChar: string;
    };
}

interface CacheEntry {
    content: LLMReportContent;
    timestamp: number;
}

// ==========================================
// LRU Cache (max 10,000 entries)
// ==========================================

class LRUCache<K, V> {
    private maxSize: number;
    private cache: Map<K, V>;

    constructor(maxSize: number) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }

    get(key: K): V | undefined {
        const item = this.cache.get(key);
        if (item !== undefined) {
            this.cache.delete(key);
            this.cache.set(key, item);
        }
        return item;
    }

    set(key: K, value: V): void {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, value);
    }

    has(key: K): boolean {
        return this.cache.has(key);
    }
}

// ==========================================
// Module State
// ==========================================

const reportCache = new LRUCache<string, CacheEntry>(10000);
const CACHE_TTL = 90 * 24 * 60 * 60 * 1000; // 90일

// ==========================================
// Prompt Template
// ==========================================

const REPORT_PROMPT = `당신은 한국 최고의 작명 전문가예요. 아래 예시와 **완전히 동일한 스타일**로 이름 리포트를 생성해주세요.

## ⚠️ 가장 중요한 규칙
- 모든 문장은 "~에요.", "~해요.", "~거예요.", "~있어요."로 끝나야 해요
- "~입니다.", "~합니다." 절대 사용 금지
- "~융성함.", "~거느림." 같은 명사형 종결 금지

## 입력 정보
이름: {fullName}
한자: {hanjaChars}
각 글자 정보:
{charInfo}

성명학 분석 결과:
{analysisInfo}

## 예시 (김시랑 金詩朗) - 이 스타일을 그대로 따라해주세요

### summary 예시 (2문장, 이름을 언급하지 않음)
"단단함과 섬세함, 밝음이 조화롭게 어우러진 아름다운 이름이에요. 예술적 재능으로 세상을 밝히고 많은 사람들에게 영감을 줄 거예요."

### characters 예시
[
  {
    "hanja": "詩",
    "meaning": "시, 문학, 풍부한 감성, 마음을 표현하다.",
    "story": "자신의 생각과 감정을 아름다운 언어로 표현하는 문학적 재능을 상징해요. 세상을 시인의 눈으로 바라보는 섬세함을 의미해요."
  },
  {
    "hanja": "朗",
    "meaning": "밝다, 환하다, 소리가 맑다, 명랑하다.",
    "story": "달빛처럼 환하고 목소리가 맑은 것을 뜻해요. 성격이 쾌활하고 앞날이 훤히 트인다는 긍정적인 메시지를 담고 있어요."
  }
]

### energy 예시
{
  "title": "맑은 목소리와 뛰어난 표현력",
  "content": "맑은 소리(朗)와 깊은 표현력(詩)을 겸비해서, 명확하게 전달하는 리더나 예술가로 성장하라는 뜻이에요."
}

### blessing 예시
{
  "title": "명랑하고 구김살 없는 예술가",
  "content": "섬세한 재능과 밝고 명랑한 에너지로 주변에 즐거움을 주는 사람이 되라는 축복을 담고 있어요."
}

### analysisComments 예시
{
  "yinYang": "차분한 '음'과 활발한 '양'이 골고루 섞여 있어서 균형이 완벽한 이름이에요. 감정과 이성이 균형 잡힌 인생을 살아갈 수 있음을 의미해요.",
  
  "pronunciation": "평범함을 거부하는 '혁신가'의 소리예요. 남다른 개성과 재능으로 세상을 놀라게 할 예술가나 리더에게 어울려요.",
  
  "numerology": "초년운: 작은 것에서 시작해 큰 성공을 이루는 융성한 운이에요. 어린 시절부터 남다른 재능이 빛을 발하며, 일찍이 성공의 기반을 다지게 될 거예요.\\n청년운: 리더십이 탁월해서 많은 사람을 이끄는 강력한 리더가 돼요. 뛰어난 통찰력과 결단력으로 주변의 신뢰를 얻고, 조직을 이끄는 위치에 오르게 될 거예요.\\n중년운: 비상한 재주가 있으나 다소 고독할 수 있어요. 높은 성취를 이루지만, 정신적 깊이를 추구하며 내면의 성장에 집중하는 시기예요.\\n말년운: 모든 뜻을 이루고 존경받는 대성공 운이에요. 평생의 노력이 결실을 맺어서, 많은 사람들에게 귀감이 되는 삶을 살게 될 거예요.",
  
  "naturalElement": "사주에 필요한 열정(火)과 결실(金)의 에너지를 이름이 완벽하게 채워주고 있어요. 뜨거운 불로 쇠를 녹여 빛나는 보석을 만들듯, 치열한 노력 끝에 화려한 성공을 거두게 도와줘요.",
  
  "forbiddenChar": "이름에 쓰면 안 되는 흉한 한자가 전혀 없어요. 모두 긍정적이고 세련된 의미로 평가받는 좋은 한자들이에요."
}

## 생성 요청
입력된 이름에 대해 위 예시와 **동일한 스타일, 동일한 깊이, 동일한 분량**으로 콘텐츠를 생성해주세요.

JSON만 응답:
{
  "summary": "정확히 2문장 (이름 언급 없이, ~에요/해요로 끝남)",
  "characters": [{"hanja": "", "meaning": "키워드들.", "story": "2문장 (~에요/해요로 끝남)"}],
  "energy": {"title": "5-10글자", "content": "1-2문장 (~에요/해요로 끝남)"},
  "blessing": {"title": "5-10글자", "content": "1-2문장 (~에요/해요로 끝남)"},
  "analysisComments": {
    "yinYang": "2문장 (~에요/해요로 끝남)",
    "pronunciation": "2문장 (~에요/해요로 끝남)",
    "numerology": "초년운: 2-3문장\\n청년운: 2-3문장\\n중년운: 2-3문장\\n말년운: 2-3문장 (모두 ~에요/해요로 끝남)",
    "naturalElement": "2문장 (비유 사용, ~에요/해요로 끝남)",
    "forbiddenChar": "1-2문장 (~에요/해요로 끝남)"
  }
}`;

// ==========================================
// LLM 호출
// ==========================================

async function callReportLLM(
    input: ReportInput,
    hanjaInfoList: HanjaInfo[],
    analysisData: AnalysisData
): Promise<LLMResponseFormat | null> {
    const fullName = input.surname + input.givenName.join('');
    const hanjaChars = input.surnameHanja + input.givenNameHanja.join('');
    const charInfo = hanjaInfoList.map(h =>
        `- ${h.hanja}(${h.hangul}): ${h.meaning_korean}`
    ).join('\n');

    const analysisInfo = formatAnalysisData(analysisData);

    const prompt = REPORT_PROMPT
        .replace('{fullName}', fullName)
        .replace('{hanjaChars}', hanjaChars)
        .replace('{charInfo}', charInfo)
        .replace('{analysisInfo}', analysisInfo);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(
            'https://us-central1-erumi-a312b.cloudfunctions.net/gemini',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    model: LLM_CONFIG.gemini.model,
                    temperature: 0.5,
                    maxOutputTokens: 2000
                }),
                signal: controller.signal
            }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`LLM API error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('Empty response from LLM');
        }

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }

        return JSON.parse(jsonMatch[0]) as LLMResponseFormat;
    } catch (error) {
        console.error('[Report LLM] Error:', error);
        return null;
    }
}

function formatAnalysisData(data: AnalysisData): string {
    const numerologyDetails = data.numerology.scores.map(s =>
        `${s.name}(${s.ageRange}): 수리 ${s.suriNumber} - ${s.level} (${s.interpretation})`
    ).join('\n  ');

    return `- 음양: ${data.yinYang.isBalanced ? '균형' : '불균형'} (음${data.yinYang.yinCount}/양${data.yinYang.yangCount})
- 발음오행: ${data.pronunciation.elements.join('→')} (${data.pronunciation.flow})
- 수리성명학:\n  ${numerologyDetails}
- 자원오행: ${Object.entries(data.naturalElement.nameElements).filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v}%`).join(', ')}${data.naturalElement.filled?.length ? ` (보완: ${data.naturalElement.filled.join(', ')})` : ''}
- 불용문자: ${data.forbiddenChar.hasIssue ? data.forbiddenChar.issues.join(', ') : '없음'}`;
}

// ==========================================
// 템플릿 Fallback
// ==========================================

function generateFallbackContent(
    input: ReportInput,
    hanjaInfoList: HanjaInfo[],
    analysisData: AnalysisData
): LLMReportContent {
    const name = input.givenName.join('');
    const meanings = hanjaInfoList.map(h => h.meaning_korean.split(' ')[0]).join('과 ');

    // Summary
    const summary = `${meanings}의 의미를 담은 아름다운 이름이에요. ${name}은(는) 밝은 미래를 향해 나아갈 것입니다.`;

    // Carousel
    const carousel: CarouselCard[] = [
        {
            type: 'meaning',
            title: '글자별 의미',
            characters: hanjaInfoList.map(h => ({
                hanja: h.hanja,
                meaning: h.meaning_korean,
                story: h.meaning_story || `${h.meaning_korean}의 뜻을 담은 글자입니다.`,
            })),
        },
        {
            type: 'energy',
            title: '이름의 기운',
            content: `${meanings}의 조화로운 기운을 담고 있습니다.`,
        },
        {
            type: 'blessing',
            title: '밝은 미래의 축복',
            content: `${name}이(가) 행복하고 빛나는 미래를 향해 나아가길 축복합니다.`,
        },
    ];

    // Analysis Comments
    const analysisComments = {
        yinYang: analysisData.yinYang.isBalanced
            ? '음과 양이 균형을 이루고 있어요.'
            : '한쪽으로 치우친 개성 있는 구성이에요.',
        pronunciation: `${analysisData.pronunciation.flow} 흐름의 발음 오행이에요.`,
        numerology: '각 시기별 운세가 분석되었어요.',
        naturalElement: analysisData.naturalElement.filled?.length
            ? `${analysisData.naturalElement.filled.join(', ')}의 에너지를 보완해줘요.`
            : '이름의 오행 분포가 확인되었어요.',
        forbiddenChar: analysisData.forbiddenChar.hasIssue
            ? '일부 글자에 주의가 필요해요.'
            : '모든 글자가 길하게 구성되었어요.',
    };

    return { summary, carousel, analysisComments };
}

// ==========================================
// 메인 함수
// ==========================================

export async function generateReportContent(
    input: ReportInput,
    hanjaInfoList: HanjaInfo[],
    analysisData: AnalysisData
): Promise<LLMReportContent> {
    const cacheKey = input.givenNameHanja.join('+');

    // Tier 0: LLM 호출
    const llmResult = await callReportLLM(input, hanjaInfoList, analysisData);

    if (llmResult) {
        const content = convertLLMResponse(llmResult);
        reportCache.set(cacheKey, { content, timestamp: Date.now() });
        return content;
    }

    // Tier 1: 캐시 조회 (LLM 실패 시)
    if (reportCache.has(cacheKey)) {
        const cached = reportCache.get(cacheKey)!;
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            console.log('[Report LLM] Using cached result');
            return cached.content;
        }
    }

    // Tier 2: 템플릿 fallback
    console.log('[Report LLM] Using fallback template');
    return generateFallbackContent(input, hanjaInfoList, analysisData);
}

function convertLLMResponse(response: LLMResponseFormat): LLMReportContent {
    return {
        summary: response.summary,
        carousel: [
            {
                type: 'meaning',
                title: '글자별 의미',
                characters: response.characters.map(c => ({
                    hanja: c.hanja,
                    meaning: c.meaning,
                    story: c.story,
                })),
            },
            {
                type: 'energy',
                title: response.energy.title,
                content: response.energy.content,
            },
            {
                type: 'blessing',
                title: response.blessing.title,
                content: response.blessing.content,
            },
        ],
        analysisComments: response.analysisComments,
    };
}

export default {
    generateReportContent,
};
