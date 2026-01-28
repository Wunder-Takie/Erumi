/**
 * Erumi Design System - DialogItem Component
 * Content variants for Dialog component
 */
import * as React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { space } from '../tokens';

// =============================================================================
// Types
// =============================================================================

export interface DialogItemProps {
    /** Content variant type */
    variant?: 'zodiacTime' | 'dateAndTimeWheel' | 'custom';
    /** Maximum height for scrollable content */
    maxHeight?: number;
    /** Custom style */
    style?: ViewStyle;
    /** Children content (SelectItems or custom) */
    children: React.ReactNode;
}

// =============================================================================
// DialogItem Component
// =============================================================================

export const DialogItem: React.FC<DialogItemProps> = ({
    variant = 'custom',
    maxHeight = 280,
    style,
    children,
}) => {
    // zodiacTime variant: scrollable list with bottom fade effect
    if (variant === 'zodiacTime') {
        return (
            <View style={[styles.container, { height: maxHeight }, style]}>
                <MaskedView
                    style={styles.maskedContainer}
                    maskElement={
                        <LinearGradient
                            colors={['black', 'black', 'black', 'transparent']}
                            locations={[0, 0.75, 0.85, 1]}
                            style={styles.maskGradient}
                        />
                    }
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled
                    >
                        {children}
                    </ScrollView>
                </MaskedView>
            </View>
        );
    }

    // dateAndTimeWheel variant: for DateTimePicker
    if (variant === 'dateAndTimeWheel') {
        return (
            <View style={[styles.wheelContainer, style]}>
                {children}
            </View>
        );
    }

    // custom variant: pass-through
    return (
        <View style={[styles.container, style]}>
            {children}
        </View>
    );
};

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    maskedContainer: {
        flex: 1,
    },
    maskGradient: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        gap: 4, // Figma gap
        paddingBottom: space[600], // 24 - space for gradient fade
    },
    wheelContainer: {
        width: '100%',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default DialogItem;
