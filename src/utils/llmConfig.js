/**
 * llmConfig.js
 * LLM 기반 이름 평가 설정
 */

export const LLM_CONFIG = {
    // LLM 제공자 선택
    provider: 'gemini', // 'gemini' | 'openai'

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
        maxCandidates: 20, // LLM 평가할 최대 후보 수
        scoreWeight: 0.15, // 최종 점수에서 LLM 평가 비중 (15%)
        cacheEnabled: true, // 동일 이름 캐싱
        cacheTTL: 86400000, // 24시간 (밀리초)
    },

    // API 키 (환경변수에서 로드)
    getApiKey: () => {
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
