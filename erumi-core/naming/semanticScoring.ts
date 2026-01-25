/**
 * semanticScoring.ts
 * 오행/의미/현대성 관련 스코어링 유틸리티
 */

// ============================================
// Types
// ============================================

export type ElementType = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';

export interface ElementWeights {
    Wood: number;
    Fire: number;
    Earth: number;
    Metal: number;
    Water: number;
}

export interface HanjaInfo {
    element: ElementType;
    hangul: string;
    hanja: string;
    strokes: number;
    modernity?: number;
}

export interface SurnameInfo {
    element?: string;  // string으로 변경하여 suriUtils와 호환
    hangul: string;
    strokes: number;
}

// ============================================
// Constants: 오행 상생/상극 테이블
// ============================================

// 오행 상생 (生): A가 B를 생성/강화
export const ELEMENT_GENERATION: Record<ElementType, ElementType> = {
    Wood: 'Fire',    // 木生火
    Fire: 'Earth',   // 火生土
    Earth: 'Metal',  // 土生金
    Metal: 'Water',  // 金生水
    Water: 'Wood'    // 水生木
};

// 오행 상극 (剋): A가 B를 억제/제압
export const ELEMENT_DESTRUCTION: Record<ElementType, ElementType> = {
    Wood: 'Earth',   // 木剋土
    Fire: 'Metal',   // 火剋金
    Earth: 'Water',  // 土剋水
    Metal: 'Wood',   // 金剋木
    Water: 'Fire'    // 水剋火
};

// ============================================
// Functions
// ============================================

/**
 * 오행 상생 관계인지 확인
 */
export function isGenerating(from: ElementType, to: ElementType): boolean {
    return ELEMENT_GENERATION[from] === to;
}

/**
 * 오행 상극 관계인지 확인
 */
export function isDestructing(from: ElementType, to: ElementType): boolean {
    return ELEMENT_DESTRUCTION[from] === to;
}

/**
 * 고급 오행 점수 계산 (상생/상극 포함)
 * @param hanja1 - 첫 번째 한자 정보
 * @param hanja2 - 두 번째 한자 정보
 * @param surnameInfo - 성씨 정보 (선택)
 * @param elementWeights - 스토리 기반 오행 가중치 (선택)
 * @returns 오행 점수 (-20 ~ 80)
 */
export function calculateAdvancedElementScore(
    hanja1: HanjaInfo,
    hanja2: HanjaInfo,
    surnameInfo?: SurnameInfo | null,
    elementWeights?: Partial<ElementWeights> | null
): number {
    let score = 20; // 기본 점수
    const el1 = hanja1.element;
    const el2 = hanja2.element;

    // 상생 보너스
    if (isGenerating(el1, el2)) score += 10;
    if (surnameInfo?.element && isGenerating(surnameInfo.element as ElementType, el1)) {
        score += 5;
    }

    // 상극 페널티
    if (isDestructing(el1, el2)) score -= 10;

    // 스토리/태그 기반 가중치
    if (elementWeights) {
        const weight1 = elementWeights[el1] || 0;
        const weight2 = elementWeights[el2] || 0;
        const totalWeight = Object.values(elementWeights).reduce((a, b) => (a || 0) + (b || 0), 0);

        if (totalWeight > 0) {
            // 선택된 오행 보너스
            score += weight1 * 0.4;
            score += weight2 * 0.4;

            // 선택되지 않은 오행 페널티
            if (weight1 === 0) score -= 15;
            if (weight2 === 0) score -= 15;

            // 두 한자가 모두 높은 가중치 오행이면 시너지
            if (weight1 >= 15 && weight2 >= 15) {
                score += 10;
            }
        }
    }

    return Math.max(-20, Math.min(80, score));
}

/**
 * 현대성 점수 계산
 * @param modernity1 - 첫 번째 한자 현대성 (1-10)
 * @param modernity2 - 두 번째 한자 현대성 (1-10)
 * @returns 현대성 점수 (0-20)
 */
export function calculateModernityBonus(modernity1: number, modernity2: number): number {
    const avg = (modernity1 + modernity2) / 2;

    if (avg >= 8) return 20;      // 매우 현대적
    if (avg >= 7) return 15;      // 현대적  
    if (avg >= 6) return 10;      // 보통
    if (avg >= 5) return 5;       // 약간 고전적
    return 0;                      // 고전적
}

/**
 * 오행 요소 배열 생성
 */
export function getElementArray(element: ElementType): ElementType[] {
    return [element, ELEMENT_GENERATION[element]];
}
