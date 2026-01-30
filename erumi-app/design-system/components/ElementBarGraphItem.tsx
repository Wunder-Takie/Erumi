/**
 * Erumi Design System - ElementBarGraphItem Component
 * 오행(五行) 그래프의 개별 바 아이템
 */
import * as React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, typography } from '../tokens';

// =============================================================================
// Types
// =============================================================================

export type ElementType = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
export type ElementAmount = 0 | 1 | 2 | 3;

export interface ElementBarGraphItemProps {
    /** 오행 타입 */
    elementType: ElementType;
    /** 사주에서 해당 오행의 개수 (0-3) */
    amount: ElementAmount;
    /** 이름도 해당 오행을 가지고 있는지 */
    hasNameValue?: boolean;
    /** Custom container style */
    style?: ViewStyle;
}

// =============================================================================
// Element Configurations
// =============================================================================

const GRAPH_HEIGHT = 120;
const GRAPH_WIDTH = 52;
const SEGMENT_HEIGHT = 40; // GRAPH_HEIGHT / 3
const CORNER_RADIUS = 12;
const GAP = 12;
const NAME_BOX_HEIGHT = 40;

const elementConfig: Record<ElementType, {
    label: string;
    barColor: string;
}> = {
    wood: {
        label: '🌳 목(木)',
        barColor: '#7EDEA0', // colors.background.success.primary
    },
    fire: {
        label: '🔥 화(火)',
        barColor: '#FF969B', // colors.background.danger.primary
    },
    earth: {
        label: '🪨 토(土)',
        barColor: '#B8AA91',
    },
    metal: {
        label: '⚪ 금(金)',
        barColor: '#A3A3A3',
    },
    water: {
        label: '💧 수(水)',
        barColor: '#8FB9FF',
    },
};

const NAME_VALUE_BG_COLOR = '#8CCAE7';
const NAME_VALUE_BORDER_COLOR = colors.text.default.primary; // #332C21

// Helper to create rounded rect path with individual corner radii
function createRoundedRectPath(
    x: number, y: number, w: number, h: number,
    rtl: number, rtr: number, rbr: number, rbl: number
): string {
    return `
        M ${x + rtl} ${y}
        H ${x + w - rtr}
        ${rtr > 0 ? `A ${rtr} ${rtr} 0 0 1 ${x + w} ${y + rtr}` : `L ${x + w} ${y}`}
        V ${y + h - rbr}
        ${rbr > 0 ? `A ${rbr} ${rbr} 0 0 1 ${x + w - rbr} ${y + h}` : `L ${x + w} ${y + h}`}
        H ${x + rbl}
        ${rbl > 0 ? `A ${rbl} ${rbl} 0 0 1 ${x} ${y + h - rbl}` : `L ${x} ${y + h}`}
        V ${y + rtl}
        ${rtl > 0 ? `A ${rtl} ${rtl} 0 0 1 ${x + rtl} ${y}` : `L ${x} ${y}`}
        Z
    `;
}

// =============================================================================
// ElementBarGraphItem Component
// =============================================================================

export const ElementBarGraphItem: React.FC<ElementBarGraphItemProps> = ({
    elementType,
    amount,
    hasNameValue = false,
    style,
}) => {
    const config = elementConfig[elementType];
    const filledHeight = amount * SEGMENT_HEIGHT;
    const [graphWidth, setGraphWidth] = React.useState(0);
    const isLayoutReady = graphWidth > 0;

    return (
        <View style={[styles.container, style]}>
            {/* Graph bar */}
            <View
                style={styles.graph}
                onLayout={(e) => setGraphWidth(Math.floor(e.nativeEvent.layout.width))}
            >
                {/* Filled bar (사주 오행) */}
                {amount > 0 && (
                    <View
                        style={[
                            styles.filledBar,
                            {
                                height: filledHeight,
                                backgroundColor: config.barColor,
                                // hasNameValue일 때 상단 radius = 0 (이름 박스와 연결)
                                borderTopLeftRadius: hasNameValue ? 0 : CORNER_RADIUS,
                                borderTopRightRadius: hasNameValue ? 0 : CORNER_RADIUS,
                            },
                        ]}
                    />
                )}

                {/* Name value indicator (이름 오행) - with dashed border */}
                {/* amount가 3이면 바 내부 상단에 오버레이, 아니면 바 위에 표시 */}
                {hasNameValue && isLayoutReady && (
                    <View
                        style={[
                            styles.nameBox,
                            amount === 3
                                ? { top: 0 }
                                : { bottom: filledHeight },
                            // 동적 borderRadius: amount > 0이면 하단은 바와 연결되므로 0
                            {
                                borderTopLeftRadius: CORNER_RADIUS,
                                borderTopRightRadius: CORNER_RADIUS,
                                borderBottomLeftRadius: amount > 0 ? 0 : CORNER_RADIUS,
                                borderBottomRightRadius: amount > 0 ? 0 : CORNER_RADIUS,
                            }
                        ]}
                    >
                        {/* Background with dashed border */}
                        {/* SVG 대신 View 사용 - 보더 일관성 */}
                        <View style={[
                            styles.nameBorderView,
                            {
                                borderTopLeftRadius: CORNER_RADIUS,
                                borderTopRightRadius: CORNER_RADIUS,
                                borderBottomLeftRadius: amount > 0 ? 0 : CORNER_RADIUS,
                                borderBottomRightRadius: amount > 0 ? 0 : CORNER_RADIUS,
                            }
                        ]} />
                        {/* "이름" 텍스트 */}
                        <Text style={styles.nameText}>이름</Text>
                    </View>
                )}
            </View>

            {/* Label */}
            <Text style={styles.label}>{config.label}</Text>
        </View>
    );
};

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1, // 균등하게 공간 분배
        alignItems: 'stretch', // 자식(graph)이 늘어나도록
        gap: GAP,
    },
    graph: {
        // width 제거 - alignSelf stretch로 늘어남
        height: GRAPH_HEIGHT,
        backgroundColor: colors.background.default.higher,
        borderRadius: CORNER_RADIUS,
        overflow: 'hidden',
        position: 'relative',
    },
    filledBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderRadius: CORNER_RADIUS,
    },
    nameBox: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: NAME_BOX_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: NAME_VALUE_BG_COLOR,  // 배경색 (틈 방지)
        overflow: 'hidden',
        // borderRadius는 동적으로 적용됨
    },
    nameBorderView: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderWidth: 1.5,
        borderColor: NAME_VALUE_BORDER_COLOR,
        borderStyle: 'dashed',
    },
    nameText: {
        ...typography.label.md,
        color: colors.text.neutral.primary, // #000000
    },
    label: {
        ...typography.label.sm,
        color: colors.text.default.primary, // #332C21
        textAlign: 'center',
    },
});

export default ElementBarGraphItem;
