/**
 * Erumi Design System - YinYang Component
 * 음양(陰陽) 표시 컴포넌트
 */
import * as React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Icon } from './Icon';
import { colors, typography } from '../tokens';

// =============================================================================
// Types
// =============================================================================

export type YinYangVariant = 'yin' | 'yang';

export interface YinYangProps {
    /** 음양 variant */
    variant: YinYangVariant;
    /** Custom container style */
    style?: ViewStyle;
}

// =============================================================================
// Configuration
// =============================================================================

const GAP = 4;
const ICON_SIZE = 16;

const variantConfig: Record<YinYangVariant, {
    label: string;
    iconName: 'moon' | 'sun';
    iconColor: string;
}> = {
    yin: {
        label: '음',
        iconName: 'moon',
        iconColor: colors.icon.element.water, // blue[500]
    },
    yang: {
        label: '양',
        iconName: 'sun',
        iconColor: colors.icon.element.fire, // red[500]
    },
};

// =============================================================================
// YinYang Component
// =============================================================================

export const YinYang: React.FC<YinYangProps> = ({
    variant,
    style,
}) => {
    const config = variantConfig[variant];

    return (
        <View style={[styles.container, style]}>
            <Text style={styles.label}>{config.label}</Text>
            <Icon
                name={config.iconName}
                size={ICON_SIZE}
                iconStyle="solid"
                color={config.iconColor}
            />
        </View>
    );
};

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: GAP,
    },
    label: {
        ...typography.label.mdSemiBold,
        color: colors.text.default.tertiary, // Figma: text/default/tertiary
    },
});

export default YinYang;
