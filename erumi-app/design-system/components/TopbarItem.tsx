/**
 * Erumi Design System - TopbarItem Component
 * Child component for Topbar's leadingWrapper and trailingWrapper
 */
import * as React from 'react';
import { Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { colors, space, typography } from '../tokens';

// =============================================================================
// Types
// =============================================================================

export type TopbarItemStatus = 'label' | 'icon';

export interface TopbarItemProps {
    /** Item type - label (text button) or icon */
    status: TopbarItemStatus;
    /** Text label (required when status='label') */
    label?: string;
    /** Custom label color */
    labelColor?: string;
    /** Icon element (required when status='icon') */
    icon?: React.ReactNode;
    /** Press handler */
    onPress?: () => void;
    /** Custom style */
    style?: ViewStyle;
}

// =============================================================================
// TopbarItem Component
// =============================================================================

// Touch area padding (to meet 44px minimum)
const TOUCH_SLOP = { top: 11, bottom: 11, left: 8, right: 8 };

export const TopbarItem: React.FC<TopbarItemProps> = ({
    status,
    label,
    labelColor,
    icon,
    onPress,
    style,
}) => {
    if (status === 'label') {
        return (
            <Pressable
                style={[styles.labelContainer, style]}
                onPress={onPress}
                hitSlop={TOUCH_SLOP}
            >
                <Text style={[styles.labelText, labelColor && { color: labelColor }]}>
                    {label}
                </Text>
            </Pressable>
        );
    }

    // status === 'icon'
    return (
        <Pressable
            style={[styles.iconContainer, style]}
            onPress={onPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // 24 + 20 = 44
        >
            {icon}
        </Pressable>
    );
};

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
    labelContainer: {
        paddingHorizontal: space[200], // 8 (Figma)
        height: 18, // Figma original
        justifyContent: 'center',
        alignItems: 'center',
    },
    labelText: {
        ...typography.label.md, // fontSize 14, Medium (fontWeight 500)
        color: colors.primitives.sand[600], // #6D614C
    },
    iconContainer: {
        width: 24, // Figma original
        height: 24, // Figma original
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default TopbarItem;
