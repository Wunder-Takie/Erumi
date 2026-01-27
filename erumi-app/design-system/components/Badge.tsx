/**
 * Erumi Design System - Badge Component
 * Auto-generated from Figma Design System
 */
import * as React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, space, radius } from '../tokens';

// =============================================================================
// Types
// =============================================================================

export type BadgeSize = 'small' | 'medium';
export type BadgeShape = 'pill' | 'rectangle';
export type BadgeColor = 'default' | 'green' | 'orange' | 'red';

export interface BadgeProps {
    /** Primary label text */
    firstLabel: string;
    /** Secondary label text (optional, shown in bold) */
    secondLabel?: string;
    /** Size of the badge */
    size?: BadgeSize;
    /** Shape of the badge */
    shape?: BadgeShape;
    /** Color variant */
    color?: BadgeColor;
    /** Custom container style */
    style?: ViewStyle;
}

// =============================================================================
// Size Configurations
// =============================================================================

const sizeConfig = {
    small: {
        paddingHorizontal: space[200], // 8
        paddingVertical: space[100],   // 4
        textStyle: typography.label.smSemiBold,  // Figma: fontSize 13
        secondTextStyle: typography.label.smBold, // Figma: fontSize 13, Bold
        gap: space[100], // 4
    },
    medium: {
        paddingHorizontal: space[300], // 12
        paddingVertical: space[150],   // 6
        textStyle: typography.label.mdSemiBold,  // fontSize 14
        secondTextStyle: typography.label.mdBold, // fontSize 14, Bold
        gap: space[100], // 4
    },
} as const;

// =============================================================================
// Shape Configurations
// =============================================================================

const shapeConfig = {
    pill: radius.full,      // 9999 (full rounded)
    rectangle: radius[200], // 8
} as const;

// =============================================================================
// Color Configurations
// =============================================================================

const colorConfig = {
    default: {
        backgroundColor: colors.background.default.high,
        firstLabelColor: colors.text.default.secondary,
        secondLabelColor: colors.text.default.primary,
    },
    green: {
        backgroundColor: colors.background.success.primary,
        firstLabelColor: colors.text.success.primary,
        secondLabelColor: colors.text.default.primary,
    },
    orange: {
        backgroundColor: colors.background.warning.primary,
        firstLabelColor: colors.text.warning.primary,
        secondLabelColor: colors.text.default.primary,
    },
    red: {
        backgroundColor: colors.background.danger.primary,
        firstLabelColor: colors.text.danger.primary,
        secondLabelColor: colors.text.default.primary,
    },
} as const;

// =============================================================================
// Badge Component
// =============================================================================

export const Badge: React.FC<BadgeProps> = ({
    firstLabel,
    secondLabel,
    size = 'medium',
    shape = 'pill',
    color = 'default',
    style,
}) => {
    const sizeStyles = sizeConfig[size];
    const borderRadius = shapeConfig[shape];
    const colorStyles = colorConfig[color];

    return (
        <View
            style={[
                styles.container,
                {
                    paddingHorizontal: sizeStyles.paddingHorizontal,
                    paddingVertical: sizeStyles.paddingVertical,
                    borderRadius,
                    backgroundColor: colorStyles.backgroundColor,
                    gap: sizeStyles.gap,
                },
                style,
            ]}
        >
            {/* First Label */}
            <Text
                style={[
                    sizeStyles.textStyle,
                    { color: colorStyles.firstLabelColor },
                ]}
            >
                {firstLabel}
            </Text>

            {/* Second Label (optional) */}
            {secondLabel && (
                <Text
                    style={[
                        sizeStyles.secondTextStyle,
                        { color: colorStyles.secondLabelColor },
                    ]}
                >
                    {secondLabel}
                </Text>
            )}
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
        alignSelf: 'flex-start', // HUG content
    },
});

export default Badge;
