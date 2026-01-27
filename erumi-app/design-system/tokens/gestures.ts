/**
 * Erumi Design System - Gesture Tokens
 * 제스처 관련 상수 및 설정값
 */

// =============================================================================
// Swipe Gesture Settings
// =============================================================================

/**
 * 수평 스와이프 (캐러셀, 탭 전환용)
 * - 수직 스크롤과 균형 있게 동작
 * - 수평 드래그 우선이지만 수직 스크롤도 가능
 */
export const horizontalSwipe = {
    /** 제스처 활성화를 위한 최소 수평 이동 거리 (px) */
    activeOffsetX: 10,
    /** 제스처 실패를 위한 수직 이동 거리 (px) - 스크롤 허용 */
    failOffsetY: 15,
    /** 스와이프 인식 최소 거리 (px) */
    threshold: 15,
    /** 속도 기반 threshold (빠른 스와이프 시) */
    fastThreshold: 8,
    /** 속도 기준 (이 이상이면 fastThreshold 적용) */
    velocityThreshold: 100,
} as const;

/**
 * 수직 스크롤과 공존하는 수평 스와이프
 * - 수직 스크롤이 있는 영역에서 사용
 * - 스크롤과 스와이프 균형
 */
export const horizontalSwipeWithScroll = {
    /** 제스처 활성화를 위한 최소 수평 이동 거리 (px) */
    activeOffsetX: 10,
    /** 제스처 실패를 위한 수직 이동 거리 (px) - 스크롤 우선 */
    failOffsetY: 10,
    /** 스와이프 인식 최소 거리 (px) */
    threshold: 30,
    /** 속도 기반 threshold (빠른 스와이프 시) */
    fastThreshold: 15,
    /** 속도 기준 (이 이상이면 fastThreshold 적용) */
    velocityThreshold: 300,
} as const;

// =============================================================================
// Animation Settings
// =============================================================================

/**
 * TabMenu 인디케이터 스프링 애니메이션
 */
export const tabIndicatorSpring = {
    tension: 300,
    friction: 20,
} as const;

// =============================================================================
// Combined Export
// =============================================================================

export const gestures = {
    horizontalSwipe,
    horizontalSwipeWithScroll,
    tabIndicatorSpring,
} as const;

export default gestures;
