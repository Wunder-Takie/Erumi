/**
 * Erumi Design System - Pagination Component
 * Dot-style page indicator for carousels/step flows
 */
import * as React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, space, radius } from '../tokens';

// =============================================================================
// Types
// =============================================================================

export interface PaginationProps {
    /** Total number of pages */
    totalPages: number;
    /** Current active page (0-indexed) */
    currentPage: number;
    /** Custom style */
    style?: ViewStyle;
}

// =============================================================================
// Pagination Component
// =============================================================================

export const Pagination: React.FC<PaginationProps> = ({
    totalPages,
    currentPage,
    style,
}) => {
    // Ensure currentPage is within bounds
    const activePage = Math.max(0, Math.min(currentPage, totalPages - 1));

    return (
        <View style={[styles.container, style]}>
            <View style={styles.wrapper}>
                {Array.from({ length: totalPages }).map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            index === activePage && styles.dotActive,
                        ]}
                    />
                ))}
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
        paddingVertical: space[200], // 8
        alignItems: 'center',
    },
    wrapper: {
        flexDirection: 'row',
        gap: space[200], // 8
        alignItems: 'center',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: radius.full, // 원형
        backgroundColor: colors.primitives.sand[200], // #E8DEC8
    },
    dotActive: {
        width: 16, // 넓어짐
        height: 6,
        borderRadius: radius.full,
        backgroundColor: colors.primitives.sand[800], // #332C21
    },
});

export default Pagination;
