/**
 * Erumi Design System - SyllableInput Component
 * Single syllable input for name characters with Hanja display
 */
import * as React from 'react';
import { useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ViewStyle, TextInput as TextInputType } from 'react-native';
import { colors, space, radius } from '../tokens';

// =============================================================================
// Types
// =============================================================================

export interface SyllableInputProps {
    /** Placeholder text */
    placeholder?: string;
    /** Input value (typing mode) */
    value?: string;
    /** Selected Hanja character */
    hanjaValue?: string;
    /** Korean meaning of Hanja */
    koreanMeaning?: string;
    /** Editing mode - controlled externally */
    isEditing?: boolean;
    /** Value change handler */
    onChangeText?: (text: string) => void;
    /** Called when entering edit mode (filled pressed) */
    onEditStart?: () => void;
    /** Called when exiting edit mode (blur) */
    onEditEnd?: () => void;
    /** Custom style */
    style?: ViewStyle;
}

// =============================================================================
// SyllableInput Component
// =============================================================================

export const SyllableInput: React.FC<SyllableInputProps> = ({
    placeholder = '글자 입력',
    value = '',
    hanjaValue,
    koreanMeaning,
    isEditing = false,
    onChangeText,
    onEditStart,
    onEditEnd,
    style,
}) => {
    const inputRef = useRef<TextInputType>(null);

    // isEditing이 true로 변경되면 자동으로 focus
    useEffect(() => {
        if (isEditing) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [isEditing]);

    const handleFilledPress = () => {
        onEditStart?.();
    };

    const handleBlur = () => {
        onEditEnd?.();
    };

    const isFilled = !!hanjaValue;

    // Filled state: hanjaValue가 있고 편집 중이 아닐 때
    if (isFilled && !isEditing) {
        return (
            <Pressable
                style={[
                    styles.container, // filled: no border
                    style,
                ]}
                onPress={handleFilledPress}
            >
                <View style={styles.textField}>
                    <Text style={styles.hanjaText}>{hanjaValue}</Text>
                    {koreanMeaning && (
                        <Text style={styles.meaningText}>{koreanMeaning}</Text>
                    )}
                </View>
            </Pressable>
        );
    }

    // Default/Editing state: 입력 모드
    return (
        <View style={[
            styles.container,
            isEditing && styles.containerFocused, // 편집 중일 때 border
            style,
        ]}>
            <View style={styles.textField}>
                <TextInput
                    ref={inputRef}
                    style={[
                        styles.input,
                        isEditing && styles.inputActive,
                    ]}
                    placeholder={isEditing ? '' : placeholder}
                    placeholderTextColor={colors.primitives.sand[500]}
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={() => {
                        if (!isEditing) {
                            onEditStart?.(); // default 상태에서 focus시 편집 모드 시작
                        }
                    }}
                    onBlur={handleBlur}
                    textAlign="center"
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
        height: 64, // Figma height
        borderRadius: radius[400], // 16
        backgroundColor: colors.primitives.sand[100], // #F4ECDD
        borderWidth: 1.5, // 항상 유지
        borderColor: 'transparent', // default: 숨김
    },
    containerFocused: {
        borderColor: colors.primitives.sand[800], // editing: #332C21
    },
    textField: {
        flex: 1,
        paddingVertical: space[300], // 12
        paddingHorizontal: space[400], // 16
        justifyContent: 'center',
        alignItems: 'center', // 가로 중앙 정렬
        gap: 4, // Figma gap
    },
    input: {
        width: '100%',
        fontSize: 16,
        fontFamily: 'Pretendard-SemiBold', // 600
        color: colors.primitives.sand[500], // placeholder color
        textAlign: 'center', // 텍스트 중앙
        padding: 0,
        margin: 0,
    },
    inputActive: {
        fontFamily: 'Pretendard-Bold', // 700
        color: colors.primitives.sand[800], // #332C21
    },
    hanjaText: {
        fontSize: 16,
        fontFamily: 'Pretendard-Bold', // 700
        color: colors.primitives.sand[800], // #332C21
        textAlign: 'center',
    },
    meaningText: {
        fontSize: 13,
        fontFamily: 'Pretendard-Bold', // 700
        color: colors.primitives.sand[800], // #332C21
        textAlign: 'center',
    },
});

export default SyllableInput;
