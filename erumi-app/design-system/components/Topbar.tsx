/**
 * Erumi Design System - Topbar Component
 * Top navigation bar with leading/trailing wrappers and title
 */
import * as React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, space, typography } from '../tokens';
import { Logo } from './Logo';

// =============================================================================
// Types
// =============================================================================

export type TopbarLocation = 'page' | 'menu';

export interface TopbarProps {
    /** Topbar variant - page (with leading/trailing) or menu (with logo/subtitle) */
    location: TopbarLocation;

    // Props for location='page'
    /** Title text (for location='page') */
    title?: string;
    /** Leading items (left side) - typically back button */
    leadingItems?: React.ReactNode;
    /** Trailing items (right side) - typically action buttons */
    trailingItems?: React.ReactNode;

    // Props for location='menu'
    /** Subtitle text (for location='menu') */
    subtitle?: string;

    /** Custom container style */
    style?: ViewStyle;
}

// =============================================================================
// Topbar Component
// =============================================================================

export const Topbar: React.FC<TopbarProps> = ({
    location,
    title,
    leadingItems,
    trailingItems,
    subtitle,
    style,
}) => {
    if (location === 'menu') {
        return (
            <View style={[styles.containerMenu, style]}>
                <Logo size="small" />
                {subtitle && (
                    <Text style={styles.subtitle}>{subtitle}</Text>
                )}
            </View>
        );
    }

    // location === 'page'
    return (
        <View style={[styles.containerPage, style]}>
            {/* Leading Wrapper */}
            <View style={styles.leadingWrapper}>
                {leadingItems}
            </View>

            {/* Title Frame */}
            <View style={styles.titleFrame}>
                {title && (
                    <Text style={styles.title}>{title}</Text>
                )}
            </View>

            {/* Trailing Wrapper */}
            <View style={styles.trailingWrapper}>
                {trailingItems}
            </View>
        </View>
    );
};

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
    // Common container styles
    containerPage: {
        flexDirection: 'row',
        height: 64,
        paddingVertical: space[300], // 12
        paddingHorizontal: space[400], // 16
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    containerMenu: {
        flexDirection: 'column',
        height: 64,
        paddingVertical: space[300], // 12
        paddingHorizontal: space[400], // 16
        alignItems: 'center',
        justifyContent: 'center',
        gap: space[200], // 8
    },

    // Wrapper styles for location='page'
    leadingWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: 40,
    },
    titleFrame: {
        flex: 1,
        flexDirection: 'column', // Figma: layoutMode VERTICAL
        alignItems: 'center',
        justifyContent: 'center',
    },
    trailingWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: 40,
    },

    // Text styles
    title: {
        ...typography.title.lg, // We need to check - fontSize 18, Bold?
        fontFamily: 'Pretendard-Bold', // fontWeight 700
        fontSize: 18,
        color: colors.primitives.sand[800], // #332C21
        textAlign: 'center',
    },
    subtitle: {
        ...typography.label.mdBold, // fontSize 14, Bold (fontWeight 700)
        color: colors.primitives.sand[600], // #6D614C
    },
});

export default Topbar;
