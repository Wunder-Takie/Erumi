/**
 * Erumi Design System - ElementBarGraph Component
 * 오행(五行) 분석 결과를 표시하는 그래프
 */
import * as React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ElementBarGraphItem, ElementType, ElementAmount } from './ElementBarGraphItem';

// Re-export types for external use
export type { ElementType, ElementAmount } from './ElementBarGraphItem';

// =============================================================================
// Types
// =============================================================================

export interface ElementValues {
    wood: ElementAmount;
    fire: ElementAmount;
    earth: ElementAmount;
    metal: ElementAmount;
    water: ElementAmount;
}

export interface ElementBarGraphProps {
    /** 각 오행별 사주 개수 (0-3) */
    elements: ElementValues;
    /** 이름이 가진 오행 목록 */
    nameElements?: ElementType[];
    /** Custom container style */
    style?: ViewStyle;
}

// =============================================================================
// Constants
// =============================================================================

const ELEMENT_ORDER: ElementType[] = ['wood', 'fire', 'earth', 'metal', 'water'];
const GAP = 12;

// =============================================================================
// ElementBarGraph Component
// =============================================================================

export const ElementBarGraph: React.FC<ElementBarGraphProps> = ({
    elements,
    nameElements = [],
    style,
}) => {
    return (
        <View style={[styles.container, style]}>
            {ELEMENT_ORDER.map((elementType) => (
                <ElementBarGraphItem
                    key={elementType}
                    elementType={elementType}
                    amount={elements[elementType]}
                    hasNameValue={nameElements.includes(elementType)}
                />
            ))}
        </View>
    );
};

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: GAP,
        alignSelf: 'stretch', // FILL - 전체 너비 사용
    },
});

export default ElementBarGraph;
