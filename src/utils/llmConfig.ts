/**
 * llmConfig.ts
 * LLM 기반 이름 평가 설정
 */

// ==========================================
// Types
// ==========================================

interface GeminiConfig {
    model: string;
    apiEndpoint: string;
    temperature: number;
    maxOutputTokens: number;
}

interface OpenAIConfig {
    model: string;
    apiEndpoint: string;
    temperature: number;
    maxTokens: number;
}

interface EvaluationConfig {
    enabled: boolean;
    maxCandidates: number;
    scoreWeight: number;
    cacheEnabled: boolean;
    cacheTTL: number;
}

export interface LLMConfigType {
    provider: 'gemini' | 'openai';
    gemini: GeminiConfig;
    openai: OpenAIConfig;
    evaluation: EvaluationConfig;
    getApiKey: () => string;
}

// ==========================================
// Configuration
// ==========================================

export const LLM_CONFIG: LLMConfigType = {
    // LLM 제공자 선택
    provider: 'gemini',

    // Gemini 설정
    gemini: {
        model: 'gemini-2.0-flash-exp',
        apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
        temperature: 0.3,
        maxOutputTokens: 500,
    },

    // OpenAI 설정 (대안)
    openai: {
        model: 'gpt-4o-mini',
        apiEndpoint: 'https://api.openai.com/v1/chat/completions',
        temperature: 0.3,
        maxTokens: 500,
    },

    // 평가 설정
    evaluation: {
        enabled: true,
        maxCandidates: 20,
        scoreWeight: 0.15,
        cacheEnabled: true,
        cacheTTL: 86400000,
    },

    // API 키 (환경변수에서 로드)
    getApiKey: (): string => {
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            return import.meta.env.VITE_GEMINI_API_KEY ||
                import.meta.env.VITE_OPENAI_API_KEY ||
                '';
        }
        return '';
    },
};

// 프롬프트 템플릿
export const EVALUATION_PROMPT = `당신은 한국 작명 전문가입니다. 다음 아기 이름을 평가해주세요.

이름: {fullName}
한자: {hanjaName}
성별: {gender}

다음 기준으로 평가하고 JSON 형식으로 응답하세요:

1. modernityScore (1-10): 현대적인 느낌. 10이 가장 현대적
2. pronunciationScore (1-10): 발음의 자연스러움. 10이 가장 자연스러움
3. isOldFashioned (boolean): 올드한 느낌인지 여부
4. imageKeywords (array): 이름에서 연상되는 이미지 키워드 2-3개
5. briefComment (string): 한줄 평가 (20자 이내)

JSON 형식으로만 응답하세요:
{
  "modernityScore": 8,
  "pronunciationScore": 9,
  "isOldFashioned": false,
  "imageKeywords": ["밝은", "세련된"],
  "briefComment": "현대적이고 부르기 좋은 이름"
}`;

export default LLM_CONFIG;
