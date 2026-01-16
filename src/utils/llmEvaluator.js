/**
 * llmEvaluator.js
 * LLM 기반 이름 평가 모듈
 */

import { LLM_CONFIG, EVALUATION_PROMPT } from './llmConfig.js';

// 평가 결과 캐시
const evaluationCache = new Map();

/**
 * LLM으로 이름 평가
 * @param {string} fullName - 성+이름 (예: "김서준")
 * @param {string} hanjaName - 한자 이름 (예: "金瑞俊")
 * @param {string} gender - 성별 ('M' | 'F' | 'N')
 * @returns {Promise<EvaluationResult | null>}
 */
export async function evaluateNameWithLLM(fullName, hanjaName, gender = 'N') {
    // 비활성화 체크
    if (!LLM_CONFIG.evaluation.enabled) {
        return null;
    }

    // API 키 체크
    const apiKey = LLM_CONFIG.getApiKey();
    if (!apiKey) {
        console.warn('[LLM] API key not configured');
        return null;
    }

    // 캐시 체크
    const cacheKey = `${fullName}:${hanjaName}`;
    if (LLM_CONFIG.evaluation.cacheEnabled && evaluationCache.has(cacheKey)) {
        const cached = evaluationCache.get(cacheKey);
        if (Date.now() - cached.timestamp < LLM_CONFIG.evaluation.cacheTTL) {
            return cached.result;
        }
        evaluationCache.delete(cacheKey);
    }

    try {
        const result = await callLLM(fullName, hanjaName, gender, apiKey);

        // 캐시 저장
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

/**
 * LLM API 호출
 */
async function callLLM(fullName, hanjaName, gender, apiKey) {
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

/**
 * Gemini API 호출
 */
async function callGemini(prompt, apiKey) {
    const { model, apiEndpoint, temperature, maxOutputTokens } = LLM_CONFIG.gemini;

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

/**
 * OpenAI API 호출 (대안)
 */
async function callOpenAI(prompt, apiKey) {
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

/**
 * LLM 응답 파싱
 */
function parseEvaluationResponse(text) {
    try {
        // JSON 블록 추출
        let jsonStr = text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }

        const parsed = JSON.parse(jsonStr);

        // 유효성 검증
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

/**
 * LLM 점수를 최종 점수에 반영
 * @param {number} baseScore - 기존 점수 (0-100)
 * @param {EvaluationResult} llmResult - LLM 평가 결과
 * @returns {number} - 조정된 점수
 */
export function applyLLMScore(baseScore, llmResult) {
    if (!llmResult) {
        return baseScore;
    }

    const weight = LLM_CONFIG.evaluation.scoreWeight; // 0.15

    // LLM 점수 계산 (0-100 스케일)
    const llmScore = (
        (llmResult.modernityScore * 5) +  // 현대성 50%
        (llmResult.pronunciationScore * 3) + // 발음 30%
        (llmResult.isOldFashioned ? -30 : 10) // 올드함 페널티 강화 (-20 → -30)
    );

    // 가중 평균
    const adjustedScore = (baseScore * (1 - weight)) + (llmScore * weight);

    return Math.round(clamp(adjustedScore, 0, 100));
}

/**
 * 여러 이름 일괄 평가
 * @param {Array} names - 이름 배열
 * @param {string} surname - 성씨
 * @returns {Promise<Map>} - 이름별 평가 결과
 */
export async function evaluateNamesWithLLM(names, surname) {
    const results = new Map();
    const maxCandidates = LLM_CONFIG.evaluation.maxCandidates;

    // 상위 후보만 평가
    const candidates = names.slice(0, maxCandidates);

    // 순차 처리 (API 제한 고려)
    for (const name of candidates) {
        const fullName = surname + (name.hangulName || name.hangul1 + name.hangul2);
        const hanjaName = name.hanjaName || (name.hanja1 + name.hanja2);
        const gender = name.gender || 'N';

        const result = await evaluateNameWithLLM(fullName, hanjaName, gender);
        if (result) {
            results.set(fullName, result);
        }

        // Rate limiting (200ms 딜레이)
        await delay(200);
    }

    return results;
}

// 유틸리티 함수
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
    evaluateNameWithLLM,
    evaluateNamesWithLLM,
    applyLLMScore
};
