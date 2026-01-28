/**
 * Erumi Design System - Pagination Component
 * Dot-style page indicator with sliding indicator animation
 * TabMenu와 동일한 슬라이딩 인디케이터 방식
 */
import * as React from 'react';
import { View, StyleSheet, ViewStyle, LayoutChangeEvent, Animated } from 'react-native';
import { colors, space, radius } from '../tokens';

// =============================================================================
// Types
// =============================================================================

export interface PaginationProps {
    /** Total number of pages */
    totalPages: number;
    /** Current active page (0-indexed) */
    currentPage: number;
    /** Scroll position (페이지 + offset, 예: 0.5 = 0과 1 사이 절반) */
    scrollPosition?: number;
    /** Custom style */
    style?: ViewStyle;
}

// =============================================================================
// Constants
// =============================================================================

const DOT_SIZE = 6;
const DOT_ACTIVE_WIDTH = 16;
const GAP = space[200]; // 8

// =============================================================================
// Pagination Component
// =============================================================================

export const Pagination: React.FC<PaginationProps> = ({
    totalPages,
    currentPage,
    scrollPosition,
    style,
}) => {
    // 각 dot의 위치 저장
    const dotLayouts = React.useRef<{ x: number; width: number }[]>([]);
    const [isReady, setIsReady] = React.useState(false);

    // 애니메이션 값
    const animatedX = React.useRef(new Animated.Value(0)).current;

    // scrollPosition이 제공되면 사용, 아니면 currentPage 사용
    const position = scrollPosition !== undefined ? scrollPosition : currentPage;

    // 인디케이터 X 위치 계산
    const calculateXPosition = React.useCallback((pos: number) => {
        if (dotLayouts.current.length === 0) {
            return 0;
        }

        const floorPos = Math.floor(pos);
        const ceilPos = Math.ceil(pos);
        const fraction = pos - floorPos;

        // 범위 체크
        const startIdx = Math.max(0, Math.min(floorPos, totalPages - 1));
        const endIdx = Math.max(0, Math.min(ceilPos, totalPages - 1));

        const startLayout = dotLayouts.current[startIdx];
        const endLayout = dotLayouts.current[endIdx];

        if (!startLayout || !endLayout) {
            return 0;
        }

        // dot 중앙 위치 계산
        const startCenterX = startLayout.x + startLayout.width / 2;
        const endCenterX = endLayout.x + endLayout.width / 2;

        // 보간: 시작 위치에서 끝 위치로 중앙 이동
        const centerX = startCenterX + (endCenterX - startCenterX) * fraction;

        // 인디케이터를 중앙에 배치 (왼쪽 = 중앙 - 너비/2)
        return centerX - DOT_ACTIVE_WIDTH / 2;
    }, [totalPages]);

    // 첫 렌더링 여부 추적
    const isFirstRender = React.useRef(true);

    // position 변경 시 애니메이션 실행 (첫 렌더링은 즉시 설정)
    React.useEffect(() => {
        if (!isReady) return;

        const targetX = calculateXPosition(position);

        if (isFirstRender.current) {
            // 첫 렌더링: 애니메이션 없이 즉시 위치 설정
            animatedX.setValue(targetX);
            isFirstRender.current = false;
        } else {
            // 이후: 애니메이션으로 이동
            Animated.spring(animatedX, {
                toValue: targetX,
                tension: 300,
                friction: 20,
                useNativeDriver: true,
            }).start();
        }
    }, [position, isReady, calculateXPosition, animatedX]);

    // Dot 레이아웃 측정
    const handleDotLayout = (index: number, event: LayoutChangeEvent) => {
        const { x, width } = event.nativeEvent.layout;
        dotLayouts.current[index] = { x, width };

        // 모든 dot이 측정되면 ready
        if (dotLayouts.current.filter(Boolean).length === totalPages && !isReady) {
            setIsReady(true);
        }
    };

    return (
        <View style={[styles.container, style]}>
            <View style={styles.wrapper}>
                {/* 배경 Dots (먼저 렌더링 = 아래에 위치) */}
                {Array.from({ length: totalPages }).map((_, index) => (
                    <View
                        key={index}
                        style={styles.dot}
                        onLayout={(e) => handleDotLayout(index, e)}
                    />
                ))}

                {/* 슬라이딩 인디케이터 (나중에 렌더링 = 위에 위치) */}
                {isReady && (
                    <Animated.View
                        style={[
                            styles.indicator,
                            {
                                transform: [{ translateX: animatedX }],
                                width: DOT_ACTIVE_WIDTH,
                            },
                        ]}
                    />
                )}
            </View>
        </View>
    );
};

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: space[400], // 16
        paddingBottom: space[400], // 16
        alignItems: 'center',
    },
    wrapper: {
        flexDirection: 'row',
        gap: GAP, // 8
        alignItems: 'center',
        position: 'relative',
    },
    dot: {
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: radius.full,
        backgroundColor: colors.primitives.sand[200], // 배경 색상
    },
    indicator: {
        position: 'absolute',
        height: DOT_SIZE,
        borderRadius: radius.full,
        backgroundColor: colors.primitives.sand[800], // 활성 색상
    },
});

export default Pagination;
