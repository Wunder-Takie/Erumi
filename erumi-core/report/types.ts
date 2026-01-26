/**
 * Erumi Report Engine - Type Definitions
 * 리포트 생성을 위한 모든 타입 정의
 */

// ============================================
// Input Types
// ============================================

/** 사주 정보 (선택) */
export interface SajuInfo {
    birthDate: string;
    birthHour: number | null;
    pillars?: {
        year: { stem: string; branch: string };
        month: { stem: string; branch: string };
        day: { stem: string; branch: string };
        hour?: { stem: string; branch: string };
    };
    elements?: Record<string, number>;
    yongsin?: string[];
}

/** 리포트 생성 입력 */
export interface ReportInput {
    surname: string;           // 성씨 (한글)
    surnameHanja: string;      // 성씨 (한자)
    givenName: string[];       // 이름 (한글 배열)
    givenNameHanja: string[];  // 이름 (한자 배열)
    saju?: SajuInfo;           // 사주 정보 (선택)
}

// ============================================
// Header Section
// ============================================

/** 글자 정보 */
export interface CharacterInfo {
    hanja: string;         // 詩
    hangul: string;        // 시
    meaning: string;       // 시 시 (음훈)
    strokes: number;       // 획수
    element?: string;      // 오행
}

/** 헤더 섹션 */
export interface HeaderSection {
    characters: CharacterInfo[];
}

// ============================================
// Summary Section
// ============================================

/** 요약 섹션 */
export interface SummarySection {
    text: string;  // 이름 풀이 요약 텍스트
}

// ============================================
// Carousel Section
// ============================================

/** 캐러셀 - 글자 의미 */
export interface CharacterMeaning {
    hanja: string;           // 詩
    meaning: string;         // 시 시
    story: string;           // 상세 스토리
}

/** 캐러셀 카드 */
export interface CarouselCard {
    type: 'meaning' | 'energy' | 'blessing';
    title: string;
    content?: string;
    characters?: CharacterMeaning[];
}

// ============================================
// Analysis Section - Yin Yang
// ============================================

/** 음양오행 글자 분석 */
export interface YinYangCharacter {
    hanja: string;
    meaning: string;
    strokes: number;
    isOdd: boolean;      // 홀수=양, 짝수=음
    type: '음' | '양';
}

/** 음양오행 결과 */
export interface YinYangResult {
    description: string;
    characters: YinYangCharacter[];
    summary: string;       // 종합 평가
    isBalanced: boolean;
}

// ============================================
// Analysis Section - Pronunciation
// ============================================

/** 발음오행 결과 */
export interface PronunciationResult {
    description: string;
    characters: {
        hanja: string;
        hangul: string;
        element: string;       // 오행
        elementKorean: string; // 木, 火, 土, 金, 水
    }[];
    relationship: 'harmonious' | 'conflicting' | 'neutral';
    flow?: string;    // 상생/상극 흐름
    summary: string;
}

// ============================================
// Analysis Section - Numerology (수리성명학)
// ============================================

/** 수리 시기 */
export interface NumerologyPeriod {
    name: '초년' | '청년' | '중년' | '말년';
    level: '대길' | '길' | '반길반흉' | '흉';
    ageRange: string;
    suriNumber: number;
    interpretation: string;
}

/** 수리성명학 결과 */
export interface NumerologyResult {
    description: string;
    periods: NumerologyPeriod[];
    summary?: string;
}

// ============================================
// Analysis Section - Natural Elements (자원오행)
// ============================================

/** 오행 그래프 */
export interface ElementGraph {
    wood: number;    // 목 (0-100)
    fire: number;    // 화 (0-100)
    earth: number;   // 토 (0-100)
    metal: number;   // 금 (0-100)
    water: number;   // 수 (0-100)
}

/** 자원오행 결과 */
export interface NaturalElementResult {
    description: string;
    hasSaju: boolean;              // 사주 정보 유무
    sajuElements: ElementGraph | null;   // 사주의 오행 (없으면 null)
    nameElements: ElementGraph;    // 이름이 채워주는 오행
    filledElements: string[];      // 채워주는 오행 목록
    summary: string;
}

// ============================================
// Analysis Section - Forbidden Characters (불용문자)
// ============================================

/** 불용문자 검사 결과 */
export interface ForbiddenCharResult {
    characters: {
        hanja: string;
        status: 'good' | 'caution' | 'forbidden';
        reason: string;
    }[];
    summary: string;
}

// ============================================
// Combined Analysis Tabs
// ============================================

/** 분석 탭 전체 */
export interface AnalysisTabs {
    yinYang: YinYangResult;
    pronunciation: PronunciationResult;
    numerology: NumerologyResult;
    naturalElement: NaturalElementResult;
    forbiddenChar: ForbiddenCharResult;
}

// ============================================
// Complete Report
// ============================================

/** 전체 리포트 */
export interface NameReport {
    header: HeaderSection;
    summary: SummarySection;
    carousel: CarouselCard[];
    analysis: AnalysisTabs;
    generatedAt: Date;
    version: string;
}
