/**
 * ReportLLMGenerator.ts
 * 리포트 콘텐츠 LLM 생성 (LLM → 캐시 → 템플릿 Fallback)
 * - 캐러셀 (글자별 의미, 이름의 기운, 축복)
 * - Summary (상단 요약)
 * - 성명학 탭 summary (5개)
 */

import { LLM_CONFIG } from '../naming/llmConfig';
import { sanitizeKoreanText } from '../utils/textUtils';
import type { CarouselCard, ReportInput } from './types';

// ==========================================
// Types
// ==========================================

export interface HanjaInfo {
    hanja: string;
    hangul: string;
    hun: string;
    meaning_story?: string;
    element?: string;
}

export interface AnalysisData {
    yinYang: { isBalanced: boolean; yinCount: number; yangCount: number };
    pronunciation: {
        flow: string;
        elements: string[];
        hangulChars: { hangul: string; element: string }[]  // 한글 발음과 오행
    };
    numerology: {
        scores: {
            name: string;
            level: string;
            ageRange: string;
            suriNumber: number;
            interpretation: string;
        }[]
    };
    naturalElement: {
        nameElements: Record<string, number>;
        filled?: string[];   // 이름이 보충하는 오행
        missing?: string[];  // 사주에서 부족한 오행 (0개인 것)
        sajuCounts?: { wood: number; fire: number; earth: number; metal: number; water: number };  // 사주 오행 개수
    };
    forbiddenChar: {
        hasIssue: boolean;
        issues: string[];
        allGood: boolean;
        characters: {
            hanja: string;
            hangul: string;
            meaning: string;
            status: 'good' | 'caution' | 'forbidden';
            reason: string;
        }[];
    };
}

export interface LLMReportContent {
    summary: string;
    carousel: CarouselCard[];
    analysisComments: {
        yinYang: string;
        pronunciation: string;
        numerologySummary: string;
        numerology: string;
        naturalElement: string;
        forbiddenChar: string;
    };
    nameImpressions?: {
        impression1: { title: string; content: string };
        impression2: { title: string; content: string };
        romanization: { title: string; content: string };
    };
    // 이름 해석 카드 (2번째 캐러셀 카드용)
    nameInterpretations?: {
        interpretation1: { title: string; description: string };
        interpretation2: { title: string; description: string };
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
        numerologySummary?: string;
        numerology: string;
        naturalElement: string;
        forbiddenChar: string;
    };
    nameImpressions?: {
        impression1: { title: string; content: string };
        impression2: { title: string; content: string };
        romanization: { title: string; content: string };
    };
    nameInterpretations?: {
        interpretation1: { title: string; description: string };
        interpretation2: { title: string; description: string };
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
const CACHE_TTL = 0; // 🔧 DEV: 캐시 즉시 만료 (테스트 후 90일로 복원)

// ==========================================
// Prompt Template
// ==========================================

const REPORT_PROMPT = `당신은 한국 최고의 작명 전문가예요. 아래 예시와 **완전히 동일한 스타일**로 이름 리포트를 생성해주세요.

## ⚠️ 가장 중요한 규칙
- 모든 문장은 "~에요.", "~해요.", "~거예요.", "~있어요."로 끝나야 해요
- "~입니다.", "~합니다." 절대 사용 금지
- "~융성함.", "~거느림." 같은 명사형 종결 금지
- **한글과 한자만 사용** - 영어, 러시아어, 일본어 등 다른 언어 절대 금지. 오행은 반드시 "목(木)", "화(火)", "토(土)", "금(金)", "수(水)" 한글+한자로만 표현

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
  "yinYang": "'음' 기운이 강하지만 '양'의 기운도 적절히 조화되어 있어서 안정감을 주는 이름이에요. 내면의 평화를 유지하며 조화로운 삶을 살아갈 수 있음을 의미해요.",
  
  "pronunciation": "부드럽고 안정적인 느낌을 주는 소리예요. 듣는 사람에게 편안함과 신뢰감을 주며, 차분한 리더십을 발휘하는 사람에게 어울려요.",
  
  "numerologySummary": "50~60자로 초년~말년 운세 종합 요약 (~에요/해요로 끝남)",
    "numerologySummary": "초년~말년 운세를 종합하여 정확히 2문장으로 요약 (~에요/해요로 끝남)",
    "numerology": "초년운: 작은 것에서 시작해 큰 성공을 이루는 융성한 운이에요. 어린 시절부터 남다른 재능이 빛을 발하며, 일찍이 성공의 기반을 다지게 될 거예요.\\n청년운: 리더십이 탁월해서 많은 사람을 이끄는 강력한 리더가 돼요. 뛰어난 통찰력과 결단력으로 주변의 신뢰를 얻고, 조직을 이끄는 위치에 오르게 될 거예요.\\n중년운: 비상한 재주가 있으나 다소 고독할 수 있어요. 높은 성취를 이루지만, 정신적 깊이를 추구하며 내면의 성장에 집중하는 시기예요.\\n말년운: 모든 뜻을 이루고 존경받는 대성공 운이에요. 평생의 노력이 결실을 맺어서, 많은 사람들에게 귀감이 되는 삶을 살게 될 거예요.",
  
  "naturalElement": "[아래 자원오행 데이터 기반 - 케이스별 예시 참조]",
  
  "forbiddenChar": "이름에 쓰면 안 되는 흉한 한자가 전혀 없어요. 모두 긍정적이고 세련된 의미로 평가받는 좋은 한자들이에요."
}

## 자원오행(naturalElement) 작성 가이드

정확히 2문장, 50~70자. 데이터의 상태에 따라 적절히 작성.

**작성 규칙:**

1. **✓ 표시 오행**: 이름이 채워주는 오행. "채워준다/보충한다/더해준다" 표현 가능.
2. **✗ 표시 오행**: 이름이 채워주지 못하는 오행. 반드시 "부족하지만" 형태로만 언급하고,.긍정적으로 마무리.
3. **모든 사주오행 ≥1**: 부족함 없음. 이름이 기운을 더해준다고 표현.

**❌ 절대 금지:**
- ✗ 표시된 오행을 "채워준다/보충한다/보완한다"고 표현하면 완전히 틀린 정보!

**✅ 중요:**
- 매번 새롭고 다양한 표현을 사용하세요
- 위 규칙만 지키면 자유롭게 창의적으로 작성하세요
- 2문장으로 자연스럽고 긍정적인 메시지를 전달하세요

## 생성 요청
입력된 이름에 대해 위 가이드를 **참고**하여 **새롭고 다양한 표현**으로 콘텐츠를 생성해주세요.

JSON만 응답:
{
  "summary": "30~40자 2문장 (이름 언급 없이, ~에요/해요로 끝남. 예: 시처럼 아름다운 감수성을 가졌어요. 환한 빛으로 세상을 밝힐 이름이에요.)",
  "characters": [{"hanja": "", "meaning": "키워드들.", "story": "2문장 (~에요/해요로 끝남)"}],
  "energy": {"title": "5-10글자", "content": "1-2문장 (~에요/해요로 끝남)"},
  "blessing": {"title": "5-10글자", "content": "1-2문장 (~에요/해요로 끝남)"},
  "analysisComments": {
    "yinYang": "50~60자로 (이름 언급 없이, ~에요/해요로 끝남). 숫자 표현 금지. 음/양 비율 자연스럽게 표현",
    "pronunciation": "50~60자로 이름 소리가 주는 느낌/인상 (이름 언급 없이, ~에요/해요로 끝남. 예: 부드럽고 맑은 소리가 나요.)",
    "numerologySummary": "초년~말년 운세를 종합하여 정확히 2문장으로 요약 (이름 언급 없이, ~에요/해요로 끝남)",
    "numerology": "초년운: 2-3문장\\n청년운: 2-3문장\\n중년운: 2-3문장\\n말년운: 2-3문장 (모두 이름 언급 없이, ~에요/해요로 끝남)",
    "naturalElement": "⚠️ 데이터의 ✓ 표시만 보고 작성! ✗ 표시된 오행은 절대 '채워준다'고 하면 안 됨. 2문장 (~에요/해요로 끝남)",
    "forbiddenChar": "50~60자로 불용문자 검사 결과 (이름 언급 없이, ~에요/해요로 끝남. 예: 사용된 한자 모두 좋은 의미를 담고 있어요.)"
  },
  "nameInterpretations": {
    "interpretation1": {"title": "5-10글자 합성적 의미", "description": "두 한자의 뜻을 합쳐 해석한 1-2문장 (~에요/해요로 끝남)"},
    "interpretation2": {"title": "5-10글자 합성적 의미", "description": "다른 관점에서 해석한 1-2문장 (~에요/해요로 끝남)"}
  }
}`;

// ==========================================
// LLM 호출
// ==========================================

async function callReportLLM(
    input: ReportInput,
    hanjaInfoList: HanjaInfo[],
    analysisData: AnalysisData,
    retryCount = 0
): Promise<LLMResponseFormat | null> {
    const MAX_RETRIES = 2;
    const fullName = input.surname + input.givenName.join('');
    const hanjaChars = input.surnameHanja + input.givenNameHanja.join('');
    const charInfo = hanjaInfoList.map(h =>
        `- ${h.hanja}(${h.hangul}): ${h.hun} `
    ).join('\n');

    const analysisInfo = formatAnalysisData(analysisData);

    // 자원오행 관련 데이터 로그
    console.log('[callReportLLM] === 자원오행 프롬프트 데이터 ===');
    console.log(analysisInfo);
    console.log('[callReportLLM] ================================');

    const prompt = REPORT_PROMPT
        .replace('{fullName}', fullName)
        .replace('{hanjaChars}', hanjaChars)
        .replace('{charInfo}', charInfo)
        .replace('{analysisInfo}', analysisInfo);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

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
            throw new Error(`LLM API error: ${response.status} `);
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('Empty response from LLM');
        }

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }

        return JSON.parse(jsonMatch[0]) as LLMResponseFormat;
    } catch (error) {
        // console.warn 사용 (console.error는 Expo LogBox에 빨간 에러로 표시됨)
        console.warn(`[Report LLM] Attempt ${retryCount + 1}/${MAX_RETRIES + 1} failed:`, error);

        // 재시도 로직
        if (retryCount < MAX_RETRIES) {
            console.log(`[Report LLM] Retrying... (${retryCount + 2}/${MAX_RETRIES + 1})`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기 후 재시도
            return callReportLLM(input, hanjaInfoList, analysisData, retryCount + 1);
        }

        return null;
    }
}

function formatAnalysisData(data: AnalysisData): string {
    const numerologyDetails = data.numerology.scores.map(s =>
        `${s.name} (${s.ageRange}): 수리 ${s.suriNumber} - ${s.level} (${s.interpretation})`
    ).join('\n  ');

    // 발음오행: 한글 발음과 오행 표시 (예: "시(水)→랑(火)")
    const pronunciationWithHangul = data.pronunciation.hangulChars
        .map(c => `${c.hangul} (${c.element})`)
        .join('→');

    // 자원오행: 명확한 구조로 전달
    const elementWithHanja: Record<string, string> = {
        Wood: '목(木)', Fire: '화(火)', Earth: '토(土)', Metal: '금(金)', Water: '수(水)'
    };
    const elementKorean: Record<string, string> = {
        wood: '목', fire: '화', earth: '토', metal: '금', water: '수'
    };

    // 각 오행별 상태 계산
    const sajuCounts = data.naturalElement.sajuCounts || { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    const nameElements = data.naturalElement.filled?.map(e => e.toLowerCase()) || [];

    // 부족한 오행 (0개) 중 이름이 채워주는 것과 안 채워주는 것 분리
    const deficientFilled: string[] = [];  // 부족 + 이름이 채움
    const deficientNotFilled: string[] = []; // 부족 + 이름이 안 채움
    const nameElementsDisplay: string[] = []; // 이름의 오행 (표시용)

    for (const [key, count] of Object.entries(sajuCounts)) {
        const koreanName = elementKorean[key];
        if (count === 0) {
            if (nameElements.includes(key)) {
                deficientFilled.push(koreanName);
            } else {
                deficientNotFilled.push(koreanName);
            }
        }
    }

    console.log('[formatAnalysisData] sajuCounts:', sajuCounts);
    console.log('[formatAnalysisData] nameElements (이름의 오행):', nameElements);
    console.log('[formatAnalysisData] deficientFilled (채워주는 부족):', deficientFilled);
    console.log('[formatAnalysisData] deficientNotFilled (못 채우는 부족):', deficientNotFilled);

    for (const elem of data.naturalElement.filled || []) {
        nameElementsDisplay.push(elementWithHanja[elem] || elem);
    }

    // 자원오행 정보 구성
    let naturalElementInfo = `이름의 오행: ${nameElementsDisplay.length > 0 ? nameElementsDisplay.join(', ') : '없음'} `;

    if (deficientFilled.length > 0) {
        naturalElementInfo += `\n  ✓ 이름이 채워주는 부족 오행: [${deficientFilled.join(', ')}] ← "채워준다" 표현 가능`;
    }
    if (deficientNotFilled.length > 0) {
        naturalElementInfo += `\n  ✗ 이름이 채워주지 않는 부족 오행: [${deficientNotFilled.join(', ')}] ← "채워준다" 표현 금지!`;
    }
    if (deficientFilled.length === 0 && deficientNotFilled.length === 0) {
        naturalElementInfo += `\n  → 사주에 부족한 오행 없음(모든 오행이 1개 이상)`;
    }

    return `- 음양: ${data.yinYang.isBalanced ? '균형' : '불균형'} (음${data.yinYang.yinCount}/양${data.yinYang.yangCount})
- 발음오행: ${pronunciationWithHangul} (${data.pronunciation.flow})
- 수리성명학: \n  ${numerologyDetails}
- 자원오행: \n  ${naturalElementInfo}
- 불용문자: ${data.forbiddenChar.allGood ? '문제 없음 (모든 한자 양호)' : data.forbiddenChar.issues.join(', ')} `;
}

// ==========================================
// LLM 응답 자원오행 검증 및 교정
// ==========================================

function validateNaturalElementComment(
    llmComment: string,
    analysisData: AnalysisData
): string {
    const sajuCounts = analysisData.naturalElement.sajuCounts || {};
    const nameElements = analysisData.naturalElement.filled?.map(e => e.toLowerCase()) || [];

    const elementKorean: Record<string, string> = {
        wood: '목', fire: '화', earth: '토', metal: '금', water: '수'
    };

    // 부족한 오행 중 이름이 채워주지 않는 것 찾기
    const deficientNotFilled: string[] = [];
    for (const [key, count] of Object.entries(sajuCounts)) {
        if (count === 0 && !nameElements.includes(key)) {
            deficientNotFilled.push(elementKorean[key] || key);
        }
    }

    console.log(`[validateNaturalElement] deficientNotFilled: ${JSON.stringify(deficientNotFilled)}`);
    console.log(`[validateNaturalElement] LLM 원본: ${llmComment}`);

    if (deficientNotFilled.length === 0) {
        return llmComment; // 교정 불필요
    }

    // 부족한 오행이 "채워진다"고 잘못 언급된 경우만 교정
    for (const elem of deficientNotFilled) {
        // 정확한 패턴: "수의 기운을 채워" 또는 "부족한 수를 채워" 등
        // ✗ 표시된 오행이 "채워/보충/보완"과 함께 언급되면 문제
        const wrongPatterns = [
            new RegExp(`${elem}[의을를]?\\s*(기운)?[을를]?\\s*(채워|보충|보완|충족)`, 'i'),
            new RegExp(`부족한\\s*${elem}[의을를]?.*?(채워|보충|보완)`, 'i'),
            new RegExp(`${elem}[의을를]?\\s*(기운)?[을를]?\\s*(더해|불어넣)`, 'i'),
        ];

        for (const pattern of wrongPatterns) {
            if (pattern.test(llmComment)) {
                console.log(`[validateNaturalElement] 잘못된 표현 발견! ${elem} 교정 중...`);
                const elemHanja = elem === '목' ? '木' : elem === '화' ? '火' : elem === '토' ? '土' : elem === '금' ? '金' : '水';
                return `사주에 ${elem}(${elemHanja})의 기운이 다소 부족하지만 걱정하지 않아도 돼요. 이름에 담긴 다른 오행들이 전체적인 균형을 잡아주고, 부족한 기운은 살아가며 자연스럽게 채워질 거예요.`;
            }
        }
    }

    return llmComment;
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
    const meanings = hanjaInfoList.map(h => h.hun).join('과 ');

    // Summary
    const summary = `${meanings}의 의미를 담은 아름다운 이름이에요.${name} 은(는) 밝은 미래를 향해 나아갈 것입니다.`;

    // Carousel
    const carousel: CarouselCard[] = [
        {
            type: 'meaning',
            title: '글자별 의미',
            characters: hanjaInfoList.map(h => ({
                hanja: h.hanja,
                meaning: `${h.hun}`,
                story: h.meaning_story || `${h.hun}의 뜻을 담은 글자입니다.`,
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
            content: `${name} 이(가) 행복하고 빛나는 미래를 향해 나아가길 축복합니다.`,
        },
    ];

    // Analysis Comments
    const analysisComments = {
        yinYang: analysisData.yinYang.isBalanced
            ? '음과 양이 균형을 이루고 있어요.'
            : '한쪽으로 치우친 개성 있는 구성이에요.',
        pronunciation: `${analysisData.pronunciation.flow} 흐름의 발음 오행이에요.`,
        numerologySummary: '각 시기별 운세가 종합적으로 분석되었어요.',
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
        const content = convertLLMResponse(llmResult, analysisData);
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

function convertLLMResponse(response: LLMResponseFormat, analysisData: AnalysisData): LLMReportContent {
    // 검증 제거 - LLM 프롬프트를 강화했으므로 LLM 응답을 직접 사용
    const naturalElementComment = response.analysisComments.naturalElement || '';

    return {
        summary: sanitizeKoreanText(response.summary),
        carousel: [
            {
                type: 'meaning',
                title: '글자별 의미',
                characters: response.characters.map(c => ({
                    hanja: c.hanja,
                    meaning: sanitizeKoreanText(c.meaning),
                    story: sanitizeKoreanText(c.story),
                })),
            },
            {
                type: 'energy',
                title: sanitizeKoreanText(response.energy.title),
                content: sanitizeKoreanText(response.energy.content),
            },
            {
                type: 'blessing',
                title: sanitizeKoreanText(response.blessing.title),
                content: sanitizeKoreanText(response.blessing.content),
            },
        ],
        analysisComments: {
            yinYang: sanitizeKoreanText(response.analysisComments.yinYang || ''),
            pronunciation: sanitizeKoreanText(response.analysisComments.pronunciation || ''),
            numerologySummary: sanitizeKoreanText(response.analysisComments.numerologySummary || '각 시기별 운세가 다양하게 구성되어 있어요.'),
            numerology: sanitizeKoreanText(response.analysisComments.numerology || ''),
            naturalElement: sanitizeKoreanText(naturalElementComment),
            forbiddenChar: sanitizeKoreanText(response.analysisComments.forbiddenChar || ''),
        },
        nameImpressions: response.nameImpressions,
        nameInterpretations: response.nameInterpretations ? {
            interpretation1: {
                title: sanitizeKoreanText(response.nameInterpretations.interpretation1?.title || ''),
                description: sanitizeKoreanText(response.nameInterpretations.interpretation1?.description || ''),
            },
            interpretation2: {
                title: sanitizeKoreanText(response.nameInterpretations.interpretation2?.title || ''),
                description: sanitizeKoreanText(response.nameInterpretations.interpretation2?.description || ''),
            },
        } : undefined,
    };
}

export default {
    generateReportContent,
};
