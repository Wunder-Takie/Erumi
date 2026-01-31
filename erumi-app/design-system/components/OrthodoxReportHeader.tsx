/**
 * Erumi Design System - OrthodoxReportHeader Component
 * 정통 작명 리포트 헤더 - variant: default | placeholder
 * 
 * Figma: OrthodoxReportHeader (componentId: 258:589)
 * - variant=default: reportOverview + categoryGuide 표시
 * - variant=placeholder: 사주 입력 안내 + 버튼 표시
 */
import * as React from 'react';
import { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    LinearTransition,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from './Button';
import { colors, typography, space } from '../tokens';

// =============================================================================
// ShimmerBox Component - Android 스타일 skeleton shimmer 애니메이션
// =============================================================================

const ShimmerBox: React.FC<{ style?: ViewStyle }> = ({ style }) => {
    const progress = useSharedValue(0);
    const [boxWidth, setBoxWidth] = React.useState(300);

    useEffect(() => {
        progress.value = withRepeat(
            withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }), // 3초, 부드럽게
            -1,
            false
        );
    }, [progress]);

    // 왼쪽에서 오른쪽으로 천천히 스위핑
    const animatedStyle = useAnimatedStyle(() => {
        const translateX = -boxWidth + progress.value * (boxWidth * 3);
        return {
            transform: [{ translateX }],
        };
    });

    const handleLayout = (event: any) => {
        const { width } = event.nativeEvent.layout;
        setBoxWidth(width);
    };

    return (
        <View
            style={[{
                overflow: 'hidden',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 12,
            }, style]}
            onLayout={handleLayout}
        >
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        width: boxWidth,
                    },
                    animatedStyle
                ]}
            >
                <LinearGradient
                    colors={[
                        'rgba(255,255,255,0)',
                        'rgba(255,255,255,0.35)',
                        'rgba(255,255,255,0)',
                    ]}
                    locations={[0.2, 0.5, 0.8]}
                    start={{ x: 0, y: 0 }}   // 좌상단
                    end={{ x: 1, y: 1 }}     // 우하단 (대각선)
                    style={{ flex: 1 }}
                />
            </Animated.View>
        </View>
    );
};

// =============================================================================
// Types
// =============================================================================

export type OrthodoxReportHeaderVariant = 'default' | 'placeholder' | 'loading' | 'error';

export interface OrthodoxReportHeaderProps {
    /** 헤더 variant */
    variant?: OrthodoxReportHeaderVariant;
    /** 리포트 개요 텍스트 (variant=default) */
    title?: string;
    /** 카테고리 안내 텍스트 (variant=default) */
    guideLabel?: string;
    /** placeholder 안내 텍스트 (variant=placeholder) */
    placeholderText?: string;
    /** placeholder 버튼 텍스트 (variant=placeholder) */
    placeholderButtonText?: string;
    /** placeholder 버튼 클릭 핸들러 */
    onPlaceholderButtonPress?: () => void;
    /** Custom container style */
    style?: ViewStyle;
}

// =============================================================================
// OrthodoxReportHeader Component
// =============================================================================

export const OrthodoxReportHeader: React.FC<OrthodoxReportHeaderProps> = ({
    variant = 'default',
    title,
    guideLabel,
    placeholderText = '생년월일을 입력하면 더 자세한 정보를 볼 수 있어요.',
    placeholderButtonText = '생년월일 입력하기',
    onPlaceholderButtonPress,
    style,
}) => {
    // Hooks must be called before any conditional returns (React rules of hooks)
    const isLoading = variant === 'loading';
    const prevVariantRef = React.useRef(variant);
    const wasLoading = prevVariantRef.current === 'loading';
    const shouldAnimate = isLoading || wasLoading;

    React.useEffect(() => {
        prevVariantRef.current = variant;
    }, [variant]);

    // variant=error: 에러 UI
    if (variant === 'error') {
        return (
            <Animated.View
                style={[styles.container, style]}
                layout={shouldAnimate ? LinearTransition.duration(300) : undefined}
            >
                <Animated.View
                    style={styles.placeholderContent}
                    layout={shouldAnimate ? LinearTransition.duration(300) : undefined}
                >
                    <Text style={styles.errorText}>분석에 실패했어요</Text>
                    <View style={styles.buttonWrapper}>
                        <Button
                            variant="outline"
                            size="small"
                            style={{ alignSelf: 'center' }}
                            onPress={onPlaceholderButtonPress}
                        >
                            다시 시도
                        </Button>
                    </View>
                </Animated.View>
                {guideLabel && (
                    <View style={styles.categoryGuideWrapper}>
                        <Text style={styles.categoryGuideText}>{guideLabel}</Text>
                    </View>
                )}
            </Animated.View>
        );
    }

    // variant=placeholder: 사주 입력 안내
    if (variant === 'placeholder') {
        return (
            <Animated.View
                style={[styles.container, style]}
                layout={shouldAnimate ? LinearTransition.duration(300) : undefined}
            >
                <Animated.View
                    style={styles.placeholderContent}
                    layout={shouldAnimate ? LinearTransition.duration(300) : undefined}
                >
                    <View style={styles.buttonWrapper}>
                        <Button
                            variant="outline"
                            size="small"
                            style={{ alignSelf: 'center' }}
                            onPress={onPlaceholderButtonPress}
                        >
                            {placeholderButtonText}
                        </Button>
                    </View>
                    <Text style={styles.placeholderText}>{placeholderText}</Text>
                </Animated.View>
                {guideLabel && (
                    <View style={styles.categoryGuideWrapper}>
                        <Text style={styles.categoryGuideText}>{guideLabel}</Text>
                    </View>
                )}
            </Animated.View>
        );
    }

    return (
        <Animated.View
            style={[styles.container, style]}
            layout={shouldAnimate ? LinearTransition.duration(300) : undefined}
        >
            {/* 내용 박스 - 애니메이션 없음 */}
            <View
                style={isLoading ? styles.placeholderContent : styles.reportOverviewWrapper}
            >
                {isLoading ? (
                    // Loading 상태: shimmer 애니메이션 + 가운데 정렬 텍스트
                    // placeholder와 동일한 높이 유지를 위해 위아래 spacer
                    <>
                        <ShimmerBox />
                        <View style={{ height: 18 }} />{/* 위 spacer */}
                        <Text style={styles.loadingText}>생년월일 분석중...</Text>
                        <View style={{ height: 18 }} />{/* 아래 spacer */}
                    </>
                ) : title ? (
                    // Default 상태: 텍스트
                    <Animated.Text
                        style={styles.reportOverviewText}
                        entering={FadeIn.duration(300)}
                    >
                        {title}
                    </Animated.Text>
                ) : null}
            </View>
            {guideLabel && (
                <View style={styles.categoryGuideWrapper}>
                    <Text style={styles.categoryGuideText}>{guideLabel}</Text>
                </View>
            )}
        </Animated.View >
    );
};

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
    // Figma: header (VERTICAL, gap: 8, padding: 8, bg: surface.secondary, borderRadius: 16)
    container: {
        gap: 8, // Figma: itemSpacing 8
        padding: 8, // Figma: padding 8
        backgroundColor: colors.background.default.higher, // Figma: #F4ECDD
        borderRadius: 16, // Figma: cornerRadius 16
    },
    // Figma: reportOverview (padding 12, bg: surface.secondary.high, borderRadius: 12)
    reportOverviewWrapper: {
        padding: 12, // Figma: padding 12
        backgroundColor: colors.background.default.high, // Figma: #E8DEC8
        borderRadius: 12, // Figma: cornerRadius 12
    },
    reportOverviewText: {
        ...typography.label.md, // Figma: 14px/500 (Medium)
        color: colors.text.default.primary, // Figma: primary text color
    },
    // Figma: categoryGuide (paddingHorizontal: 8, paddingVertical: 4)
    categoryGuideWrapper: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    categoryGuideText: {
        ...typography.label.xs, // Figma: 11px/500 (Medium)
        color: colors.text.default.tertiary, // Figma: tertiary text color
    },
    // Placeholder variant styles - Loading 박스
    // Figma: reportOverview (VERTICAL, padding 12/24, itemSpacing 12, bg: sand[200], borderRadius: 12)
    placeholderContent: {
        position: 'relative', // ShimmerBox 오버레이용
        minHeight: 88, // placeholder 박스와 동일한 높이 유지
        paddingVertical: 24, // Figma: paddingTop/Bottom 24
        paddingHorizontal: 12, // Figma: paddingLeft/Right 12
        gap: 12, // Figma: itemSpacing 12
        alignItems: 'center',
        justifyContent: 'center', // 수직 가운데 정렬
        backgroundColor: colors.background.default.high, // Figma: #E8DEC8 (VariableID:5:271)
        borderRadius: 12, // Figma: cornerRadius 12
        overflow: 'hidden', // shimmer가 박스 밖으로 나가지 않도록
    },
    // Figma: buttonWrapper (VERTICAL, counterAxisAlignItems: CENTER)
    buttonWrapper: {
        width: '100%', // FILL horizontal
        alignItems: 'center', // center the button
    },
    // Figma: 사주를 입력하면... (fontSize: 13, lineHeight: 16, color: #6D614C)
    placeholderText: {
        ...typography.label.sm, // fontSize 13, lineHeight 16
        color: colors.text.default.secondary, // Figma: #6D614C (VariableID:5:282)
        textAlign: 'center',
    },
    // Loading variant styles
    skeletonContainer: {
        width: '100%',
        gap: 8,
    },
    skeletonLine: {
        height: 14,
        backgroundColor: colors.background.default.higher,
        borderRadius: 4,
    },
    skeletonLong: {
        width: '90%',
    },
    skeletonMedium: {
        width: '60%',
    },
    loadingText: {
        ...typography.label.sm,
        color: colors.text.default.tertiary,
        textAlign: 'center',
    },
    // Error variant styles
    errorText: {
        ...typography.label.md,
        color: colors.text.default.secondary,
        textAlign: 'center',
    },
});

export default OrthodoxReportHeader;
