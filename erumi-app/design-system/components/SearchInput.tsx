/**
 * Erumi Design System - SearchInput Component
 * Text input for search functionality
 */
import * as React from 'react';
import { useState } from 'react';
import { View, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { colors, space, radius, typography } from '../tokens';

// =============================================================================
// Types
// =============================================================================

export interface SearchInputProps {
    /** Placeholder text */
    placeholder?: string;
    /** Input value */
    value?: string;
    /** Value change handler */
    onChangeText?: (text: string) => void;
    /** Focus handler */
    onFocus?: () => void;
    /** Blur handler */
    onBlur?: () => void;
    /** Auto focus on mount */
    autoFocus?: boolean;
    /** Custom style */
    style?: ViewStyle;
}

// =============================================================================
// SearchInput Component
// =============================================================================

export const SearchInput: React.FC<SearchInputProps> = ({
    placeholder = '성씨를 검색해주세요.',
    value = '',
    onChangeText,
    onFocus,
    onBlur,
    autoFocus = false,
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
        <View style={[
            styles.container,
            isFocused && styles.containerFocused,
            style,
        ]}>
            <View style={styles.textField}>
                <TextInput
                    style={[
                        styles.input,
                        isActive && styles.inputActive,
                    ]}
                    placeholder={isFocused ? '' : placeholder}
                    placeholderTextColor={colors.primitives.sand[500]}
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    autoFocus={autoFocus}
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
        height: 52, // Figma height
        borderRadius: radius.full, // 9999
        backgroundColor: colors.primitives.sand[100], // #F4ECDD
        borderWidth: 1.5, // 항상 유지 (레이아웃 밀림 방지)
        borderColor: 'transparent', // default/filled: 숨김
    },
    containerFocused: {
        borderColor: colors.primitives.sand[800], // focused: #332C21
    },
    textField: {
        flex: 1,
        paddingVertical: space[300], // 12
        paddingHorizontal: space[400], // 16
        justifyContent: 'center',
    },
    input: {
        fontSize: 14,
        fontFamily: 'Pretendard-Medium', // 500
        color: colors.primitives.sand[800], // actual text color
        padding: 0,
        margin: 0,
    },
    inputActive: {
        fontFamily: 'Pretendard-Bold', // 700
        color: colors.primitives.sand[800], // #332C21
    },
});

export default SearchInput;
