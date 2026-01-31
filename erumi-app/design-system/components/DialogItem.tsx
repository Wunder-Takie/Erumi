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
    /** Initial scroll index for selected item (zodiacTime only) */
    initialScrollIndex?: number;
    /** Item height for calculating scroll offset (default: 64 + 4 gap) */
    itemHeight?: number;
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
    initialScrollIndex,
    itemHeight = 68, // 64 (item height) + 4 (gap)
    style,
    children,
}) => {
    const scrollViewRef = React.useRef<ScrollView>(null);

    // zodiacTime variant: scrollable list with bottom fade effect
    if (variant === 'zodiacTime') {
        // 선택된 아이템 위치로 스크롤 (가운데 정렬)
        React.useEffect(() => {
            if (initialScrollIndex !== undefined && initialScrollIndex > 0 && scrollViewRef.current) {
                // 약간의 딜레이 후 스크롤 (렌더링 완료 대기)
                setTimeout(() => {
                    // 가운데 정렬: 아이템 위치 - (컨테이너 높이 / 2) + (아이템 높이 / 2)
                    const centerOffset = (initialScrollIndex * itemHeight) - (maxHeight / 2) + (itemHeight / 2);
                    scrollViewRef.current?.scrollTo({
                        y: Math.max(0, centerOffset),
                        animated: false,
                    });
                }, 50);
            }
        }, [initialScrollIndex, itemHeight, maxHeight]);

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
                        ref={scrollViewRef}
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
