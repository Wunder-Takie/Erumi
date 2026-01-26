/**
 * Erumi Design System - TextArea Component
 * Multi-line text input with optional label
 */
import * as React from 'react';
import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { colors, space, radius } from '../tokens';

// =============================================================================
// Types
// =============================================================================

export interface TextAreaProps {
    /** Show/hide label */
    showLabel?: boolean;
    /** Label text above the input */
    label?: string;
    /** Placeholder text when empty */
    placeholder?: string;
    /** Input value */
    value?: string;
    /** Value change handler */
    onChangeText?: (text: string) => void;
    /** Focus handler */
    onFocus?: () => void;
    /** Blur handler */
    onBlur?: () => void;
    /** Number of lines (height) */
    numberOfLines?: number;
    /** Custom style */
    style?: ViewStyle;
}

// =============================================================================
// TextArea Component
// =============================================================================

export const TextArea: React.FC<TextAreaProps> = ({
    showLabel = true,
    label = '라벨',
    placeholder = '내용을 입력해주세요.',
    value = '',
    onChangeText,
    onFocus,
    onBlur,
    numberOfLines = 6,
    style,
}) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = () => {
        setIsFocused(true);
        onFocus?.();
    };

    const handleBlur = () => {
        setIsFocused(false);
        onBlur?.();
    };

    const isFilled = value.length > 0;
    const isActive = isFocused || isFilled;

    return (
        <View style={[styles.container, style]}>
            {/* Label */}
            {showLabel && <Text style={styles.label}>{label}</Text>}

            {/* Input Container */}
            <View style={[
                styles.inputContainer,
                isFocused && styles.inputContainerFocused,
            ]}>
                <TextInput
                    style={[
                        styles.textField,
                        styles.input,
                        isActive && styles.inputActive,
                    ]}
                    placeholder={isFocused ? '' : placeholder}
                    placeholderTextColor={colors.primitives.sand[500]}
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    multiline
                    numberOfLines={numberOfLines}
                    textAlignVertical="top"
                    scrollEnabled={true}
                />
            </View>
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
        minHeight: 160, // Figma height
        borderRadius: radius[400], // 16
        backgroundColor: colors.primitives.sand[100], // #F4ECDD
        borderWidth: 1.5, // 항상 유지 (레이아웃 밀림 방지)
        borderColor: 'transparent', // default/filled: 숨김
    },
    inputContainerFocused: {
        borderColor: colors.primitives.sand[800], // focused only: #332C21
    },
    textField: {
        flex: 1,
        paddingVertical: space[300], // 12
        paddingHorizontal: space[400], // 16
    },
    input: {
        fontSize: 14,
        fontFamily: 'Pretendard-Medium', // 500
        color: colors.primitives.sand[800], // actual text color
        lineHeight: 18,
        textAlignVertical: 'top',
    },
    inputActive: {
        fontFamily: 'Pretendard-Medium', // 500 (same as default for TextArea)
        color: colors.primitives.sand[800], // #332C21
    },
});

export default TextArea;
