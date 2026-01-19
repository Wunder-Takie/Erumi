/**
 * llmEvaluator.ts
 * LLM 기반 이름 평가 모듈
 */

import { LLM_CONFIG, EVALUATION_PROMPT } from './llmConfig.ts';

// ==========================================
// Types
// ==========================================

type Gender = 'M' | 'F' | 'N';

export interface EvaluationResult {
    modernityScore: number;
    pronunciationScore: number;
    isOldFashioned: boolean;
    imageKeywords: string[];
    briefComment: string;
}

interface CachedEvaluation {
    result: EvaluationResult;
    timestamp: number;
}

interface NameCandidate {
    hangulName?: string;
    hangul1?: string;
    hangul2?: string;
    hanjaName?: string;
    hanja1?: string;
    hanja2?: string;
    gender?: Gender;
}

// ==========================================
// Internal State
// ==========================================

const evaluationCache = new Map<string, CachedEvaluation>();

// ==========================================
// Utility Functions
// ==========================================

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ==========================================
// Internal Functions
// ==========================================

async function callLLM(fullName: string, hanjaName: string, gender: Gender, apiKey: string): Promise<EvaluationResult | null> {
    const prompt = EVALUATION_PROMPT
        .replace('{fullName}', fullName)
        .replace('{hanjaName}', hanjaName)
        .replace('{gender}', gender === 'M' ? '남아' : gender === 'F' ? '여아' : '미정');

    if (LLM_CONFIG.provider === 'gemini') {
        return callGemini(prompt, apiKey);
    } else {
        return callOpenAI(prompt, apiKey);
    }
}

async function callGemini(prompt: string, apiKey: string, retryCount = 0): Promise<EvaluationResult | null> {
    const { model, apiEndpoint, temperature, maxOutputTokens } = LLM_CONFIG.gemini;
    const maxRetries = 2;

    const response = await fetch(
        `${apiEndpoint}/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature,
                    maxOutputTokens,
                    responseMimeType: 'application/json'
                }
            })
        }
    );

    if (response.status === 429 && retryCount < maxRetries) {
        const waitTime = Math.pow(2, retryCount + 1) * 1000;
        console.warn(`[LLM] Rate limited, retrying in ${waitTime / 1000}s...`);
        await delay(waitTime);
        return callGemini(prompt, apiKey, retryCount + 1);
    }

    if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        throw new Error('Empty response from Gemini');
    }

    return parseEvaluationResponse(text);
}

async function callOpenAI(prompt: string, apiKey: string): Promise<EvaluationResult | null> {
    const { model, apiEndpoint, temperature, maxTokens } = LLM_CONFIG.openai;

    const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: '당신은 한국 작명 전문가입니다.' },
                { role: 'user', content: prompt }
            ],
            temperature,
            max_tokens: maxTokens,
            response_format: { type: 'json_object' }
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
        throw new Error('Empty response from OpenAI');
    }

    return parseEvaluationResponse(text);
}

function parseEvaluationResponse(text: string): EvaluationResult | null {
    try {
        let jsonStr = text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }

        const parsed = JSON.parse(jsonStr);

        return {
            modernityScore: clamp(parsed.modernityScore || 5, 1, 10),
            pronunciationScore: clamp(parsed.pronunciationScore || 5, 1, 10),
            isOldFashioned: !!parsed.isOldFashioned,
            imageKeywords: Array.isArray(parsed.imageKeywords) ? parsed.imageKeywords.slice(0, 3) : [],
            briefComment: String(parsed.briefComment || '').slice(0, 50)
        };
    } catch (error) {
        console.error('[LLM] Parse error:', error);
        return null;
    }
}

// ==========================================
// Exported Functions
// ==========================================

export async function evaluateNameWithLLM(
    fullName: string,
    hanjaName: string,
    gender: Gender = 'N'
): Promise<EvaluationResult | null> {
    if (!LLM_CONFIG.evaluation.enabled) {
        return null;
    }

    const apiKey = LLM_CONFIG.getApiKey();
    if (!apiKey) {
        console.warn('[LLM] API key not configured');
        return null;
    }

    const cacheKey = `${fullName}:${hanjaName}`;
    if (LLM_CONFIG.evaluation.cacheEnabled && evaluationCache.has(cacheKey)) {
        const cached = evaluationCache.get(cacheKey)!;
        if (Date.now() - cached.timestamp < LLM_CONFIG.evaluation.cacheTTL) {
            return cached.result;
        }
        evaluationCache.delete(cacheKey);
    }

    try {
        const result = await callLLM(fullName, hanjaName, gender, apiKey);

        if (LLM_CONFIG.evaluation.cacheEnabled && result) {
            evaluationCache.set(cacheKey, {
                result,
                timestamp: Date.now()
            });
        }

        return result;
    } catch (error) {
        console.error('[LLM] Evaluation failed:', error);
        return null;
    }
}

export function applyLLMScore(baseScore: number, llmResult: EvaluationResult | null): number {
    if (!llmResult) {
        return baseScore;
    }

    const weight = LLM_CONFIG.evaluation.scoreWeight;

    const llmScore = (
        (llmResult.modernityScore * 5) +
        (llmResult.pronunciationScore * 3) +
        (llmResult.isOldFashioned ? -30 : 10)
    );

    const adjustedScore = (baseScore * (1 - weight)) + (llmScore * weight);

    return Math.round(clamp(adjustedScore, 0, 100));
}

/**
 * 하이브리드 필터: 올드한 이름 판정 강화
 * isOldFashioned=true → 무조건 제외 (LLM 판단 신뢰)
 * modernityScore <= 5 → 제외
 */
export function shouldExcludeAsOldFashioned(llmResult: EvaluationResult | null): boolean {
    if (!llmResult) {
        return false;
    }

    // isOldFashioned=true면 무조건 제외, 또는 modernityScore가 5 이하면 제외
    return llmResult.isOldFashioned || llmResult.modernityScore <= 5;
}

export async function evaluateNamesWithLLM(
    names: NameCandidate[],
    surname: string
): Promise<Map<string, EvaluationResult>> {
    const results = new Map<string, EvaluationResult>();
    const maxCandidates = LLM_CONFIG.evaluation.maxCandidates;

    const candidates = names.slice(0, maxCandidates);

    for (const name of candidates) {
        const fullName = surname + (name.hangulName || (name.hangul1 || '') + (name.hangul2 || ''));
        const hanjaName = name.hanjaName || ((name.hanja1 || '') + (name.hanja2 || ''));
        const gender: Gender = name.gender || 'N';

        const result = await evaluateNameWithLLM(fullName, hanjaName, gender);
        if (result) {
            results.set(fullName, result);
        }

        await delay(200);
    }

    return results;
}

export default {
    evaluateNameWithLLM,
    evaluateNamesWithLLM,
    applyLLMScore
};
