/**
 * NameRecommendation Types
 * 이름 추천 플로우에서 공통으로 사용되는 타입 정의
 */

// 성씨 데이터 타입 (erumi-core의 surnames.json 구조)
export interface SurnameVariant {
    hanja: string;
    strokes: number;
    element: string;
    examples: string;
    is_major: boolean;
    hun: string;
    eum: string;
}

export type SurnamesDataType = Record<string, SurnameVariant[]>;

// 성씨 선택 인터페이스
export interface SurnameItem {
    id: string;
    hangul: string;
    hanja: string;
}

// 검색 결과용 인터페이스
export interface SurnameSearchResult extends SurnameItem {
    strokes: number;
    isMajor: boolean;
}
