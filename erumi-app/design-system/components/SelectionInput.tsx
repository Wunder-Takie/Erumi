/**
 * Erumi Design System - SelectionInput Component
 * Input field with label for selection (date picker, dropdown, etc.)
 */
import * as React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { colors, space, radius, typography } from '../tokens';

// =============================================================================
// Types
// =============================================================================

export type SelectionInputShape = 'pill' | 'rectangle';

export interface SelectionInputProps {
    /** Show/hide label */
    showLabel?: boolean;
    /** Label text above the input */
    label?: string;
    /** Placeholder text when empty */
    placeholder?: string;
    /** Selected value */
    value?: string;
    /** Shape variant */
    shape?: SelectionInputShape;
    /** Press handler (to open picker/modal) */
    onPress?: () => void;
    /** Custom style */
    style?: ViewStyle;
}

// =============================================================================
// SelectionInput Component
// =============================================================================

export const SelectionInput: React.FC<SelectionInputProps> = ({
    showLabel = true,
    label = '라벨',
    placeholder = '선택해주세요.',
    value,
    shape = 'pill',
    onPress,
    style,
}) => {
    const isFilled = !!value;

    return (
        <View style={[styles.container, style]}>
            {/* Label */}
            {showLabel && <Text style={styles.label}>{label}</Text>}

            {/* Input Container */}
            <Pressable
                style={[
                    styles.inputContainer,
                    shape === 'pill' && styles.inputContainerPill,
                    shape === 'rectangle' && styles.inputContainerRectangle,
                ]}
                onPress={onPress}
            >
                <View style={styles.textField}>
                    <Text style={[
                        styles.inputText,
                        isFilled && styles.inputTextFilled,
                    ]}>
                        {value || placeholder}
                    </Text>
                </View>
            </Pressable>
        </View>
    );
};

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
    container: {
        gap: 10, // Figma gap
    },
    label: {
        fontSize: 14,
        fontFamily: 'Pretendard-Bold',
        color: colors.primitives.sand[800], // #332C21
    },
    inputContainer: {
        height: 52, // Figma height
        backgroundColor: colors.primitives.sand[100], // #F4ECDD
    },
    inputContainerPill: {
        borderRadius: radius.full, // 9999
    },
    inputContainerRectangle: {
        borderRadius: radius[400], // 16
    },
    textField: {
        flex: 1,
        paddingVertical: space[300], // 12
        paddingHorizontal: space[400], // 16
        justifyContent: 'center',
    },
    inputText: {
        fontSize: 14,
        fontFamily: 'Pretendard-Medium', // 500
        color: colors.primitives.sand[500], // #92846D
    },
    inputTextFilled: {
        fontFamily: 'Pretendard-Bold', // 700
        color: colors.primitives.sand[800], // #332C21
    },
});

export default SelectionInput;
