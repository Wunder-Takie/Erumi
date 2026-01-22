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
        model: 'gemini-2.0-flash',
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
        maxCandidates: 50,
        scoreWeight: 0.25,
        cacheEnabled: true,
        cacheTTL: 86400000,
    },

    // Firebase Functions 프록시 사용 - 클라이언트에서 API 키 불필요
    getApiKey: (): string => {
        return 'proxy';
    },
};

// 프롬프트 템플릿 (고도화 버전 v3)
export const EVALUATION_PROMPT = `당신은 2020년대 한국 작명 전문가입니다. 다음 아기 이름을 매우 엄격하게 평가해주세요.

이름: {fullName}
한자: {hanjaName}
성별: {gender}

## 평가 기준

### 1. modernityScore (1-10): 현대적인 느낌
- 10점: 서윤, 하준, 예준, 민서, 시우 같은 2020년대 트렌디한 이름
- 7-9점: 지민, 수민, 유진 같은 현대적이지만 흔한 이름
- 4-6점: 지영, 현주, 경서 같은 중립적인 이름 (부모님 세대에도 있던 이름)
- 1-3점: 영수, 영희, 철수, 순자, 영자, 진수, 영주, 영민, 민수, 민영, 민우, 경주, 찬수 같은 1970-90년대 느낌 이름

### 2. pronunciationScore (1-10): 발음 자연스러움
- 10점: 부르기 쉽고 청각적으로 아름다운 이름
- 7-9점: 무난하게 발음되는 이름
- 4-6점: 약간 어색한 이름 (예: 연지, 수예, 채지, 진예)
- 1-3점: 매우 어색하거나 다른 단어와 혼동 (예: 혜아→해아, 시민→시민권, 채소→야채, 환아→患兒, 연소→燃燒, 현예→玄藝)

### 3. isOldFashioned (boolean): 올드하거나 촌스러운 느낌
아래 조건 중 하나라도 해당되면 true:
- "영", "철", "순", "복", "갑", "정", "미", "경" 등 옛날 돌림자가 포함된 이름
- 진수, 영주, 영민, 민수, 민영, 민우, 경주, 찬수, 현주, 지영 등 1970-90년대 흔했던 이름
- 부모님 세대에 흔했던 이름

### 4. imageKeywords: 이름에서 연상되는 이미지 2-3개
### 5. briefComment: 한줄 평가 (20자 이내)

⚠️ 조금이라도 올드하거나 어색하면 낮은 점수를 주세요. 엄격하게 평가하세요.
⚠️ 민수, 민영, 민우, 진수, 영주, 영민 같은 이름은 반드시 isOldFashioned: true

JSON 형식으로만 응답:
{
  "modernityScore": 8,
  "pronunciationScore": 9,
  "isOldFashioned": false,
  "imageKeywords": ["밝은", "세련된"],
  "briefComment": "현대적이고 부르기 좋은 이름"
}`;

export default LLM_CONFIG;
