/**
 * Erumi Design System - SearchInput Component
 * Text input for search functionality
 */
import * as React from 'react';
import { useState } from 'react';
import { View, TextInput, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors, space, radius, typography } from '../tokens';
import { Icon, IconName } from './Icon';

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
    /** Show trailing icon (default: false) */
    showTrailingIcon?: boolean;
    /** Trailing icon name (default: 'X Mark') */
    trailingIcon?: IconName;
    /** Trailing icon press handler */
    onTrailingIconPress?: () => void;
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
    showTrailingIcon = false,
    trailingIcon = 'X Mark',
    onTrailingIconPress,
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
            {showTrailingIcon && (
                <TouchableOpacity
                    style={styles.trailingIconWrapper}
                    onPress={onTrailingIconPress}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Icon
                        name={trailingIcon}
                        size={20}
                        color={colors.primitives.sand[600]}
                    />
                </TouchableOpacity>
            )}
        </View>
    );
};

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
    container: {
        height: 52, // Figma height
        flexDirection: 'row', // 가로 배치 (input + icon)
        alignItems: 'center',
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
    trailingIconWrapper: {
        paddingRight: space[400], // 16
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default SearchInput;
