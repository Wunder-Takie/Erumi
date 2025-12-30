/**
 * types.ts
 * 작명 엔진 공통 타입 정의
 */

// ==========================================
// 1. Hanja (NamingUtils) Types
// ==========================================

export interface HanjaInfo {
    hanja: string;
    hangul: string;
    meaning: string;
    story: string;
    element: 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';
    strokes: number;
}

export interface FullName {
    hangul: string;
    hanja: string;
    roman: string;
}

export interface SuriInfo {
    count: number;
    info: {
        count: number;
        level: '길' | '대길';
        desc: string;
    } | null;
}

export interface NameResult {
    hangulName: string;
    hanjaName: string;
    romanName: string;
    fullName: FullName;
    hanja1: HanjaInfo;
    hanja2: HanjaInfo;
    suri: {
        초년운: SuriInfo;
        중년운: SuriInfo;
        말년운: SuriInfo;
        총운: SuriInfo;
    };
    elements: string[];
    score: number;
    scoreBreakdown?: {
        base: number;
        element: number;
        suri: number;
        bonus: number;
        modernity: number;
        penalty: number;
        raw: number;
        final: number;
        // Hanja specific
    };
    warning: {
        reason: string;
        alternative: string;
    } | null;
}

// ==========================================
// 2. Pure Korean (PureKoreanUtils) Types
// ==========================================

export interface PureKoreanWordInfo {
    word: string;
    meaning: string;
    story: string;
    emotion: string;
    imagery: string;
}

export interface PureKoreanNameResult {
    hangulName: string;
    fullName: string;
    word1: PureKoreanWordInfo;
    word2?: PureKoreanWordInfo | null; // Allow null for single words
    isSingle: boolean;
    score: number;
    scoreBreakdown: {
        base: number;
        raw: number;
        modernity: number;

        // Union specific fields (Combination vs Single)
        meaning?: number;   // Combination only
        sound?: number;     // Combination only
        harmony?: number;   // Combination only
        syllableBonus?: number; // Single only

        // Pure specific: NO penalty field
    };
    warning?: {
        reason: string;
        alternative: string;
    } | null;
}

// ==========================================
// 3. Union Type
// ==========================================

export type NameItem = NameResult | PureKoreanNameResult;
