/**
 * Erumi Design System - Button Component
 * Auto-generated from Figma Design System
 */
import * as React from 'react';
import { ReactNode } from 'react';
import {
    Pressable,
    Text,
    View,
    StyleSheet,
    ActivityIndicator,
    PressableProps,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { colors, typography, space, radius } from '../tokens';

// =============================================================================
// Types
// =============================================================================

export type ButtonLayout =
    | 'default'
    | 'hasGuideLabel'
    | 'showLeadingIcon'
    | 'showTrailingIcon';

export type ButtonVariant = 'primary' | 'neutral' | 'outline' | 'tonal';

export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
    /** Button text content */
    children: string;
    /** Layout style of the button */
    layout?: ButtonLayout;
    /** Visual variant of the button */
    variant?: ButtonVariant;
    /** Size of the button */
    size?: ButtonSize;
    /** Disabled state */
    disabled?: boolean;
    /** Loading state - shows spinner instead of content */
    isLoading?: boolean;
    /** Leading icon (left side) */
    leadingIcon?: ReactNode;
    /** Trailing icon (right side) */
    trailingIcon?: ReactNode;
    /** Guide label text (for hasGuideLabel layout) */
    guideLabel?: string;
    /** Custom container style */
    style?: ViewStyle;
}

// =============================================================================
// Size Configurations
// =============================================================================

const sizeConfig = {
    small: {
        height: 36,
        paddingHorizontal: space[500], // 20
        paddingVertical: space[300], // 12
        iconPaddingAdjust: 4,
        textStyle: typography.label.mdSemiBold, // fontSize 14, SemiBold
        iconSize: 16,
        gap: space[200], // 8
    },
    medium: {
        height: 40,
        paddingHorizontal: space[500], // 20
        paddingVertical: space[300], // 12
        iconPaddingAdjust: 4,
        textStyle: typography.label.lgSemiBold, // fontSize 16, SemiBold
        iconSize: 20,
        gap: space[100], // 4
    },
    large: {
        height: 52,
        paddingHorizontal: space[500], // 20
        paddingVertical: space[300], // 12
        iconPaddingAdjust: 8,
        textStyle: typography.label.lgBold, // fontSize 16, Bold
        iconSize: 24,
        gap: space[100], // 4
    },
} as const;

// =============================================================================
// Variant Styles
// =============================================================================

const getVariantStyles = (
    variant: ButtonVariant,
    disabled: boolean
): { container: ViewStyle; text: TextStyle } => {
    if (disabled) {
        switch (variant) {
            case 'primary':
                return {
                    container: {
                        backgroundColor: colors.background.disabled.accent,
                    },
                    text: {
                        color: colors.text.disabled.accent,
                    },
                };
            case 'outline':
                return {
                    container: {
                        backgroundColor: 'transparent',
                        borderWidth: 1.5,
                        borderColor: colors.stroke.disabled.default,
                    },
                    text: {
                        color: colors.text.disabled.default,
                    },
                };
            case 'tonal':
            case 'neutral':
            default:
                return {
                    container: {
                        backgroundColor: colors.background.disabled.default,
                    },
                    text: {
                        color: colors.text.disabled.default,
                    },
                };
        }
    }

    switch (variant) {
        case 'primary':
            return {
                container: {
                    backgroundColor: colors.background.accent.primary,
                },
                text: {
                    color: colors.background.accent.onPrimary,
                },
            };
        case 'neutral':
            return {
                container: {
                    backgroundColor: colors.background.neutral.primary,
                },
                text: {
                    color: colors.background.neutral.onPrimary,
                },
            };
        case 'outline':
            return {
                container: {
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    borderColor: colors.stroke.default.primary,
                },
                text: {
                    color: colors.text.default.primary,
                },
            };
        case 'tonal':
            return {
                container: {
                    backgroundColor: colors.background.default.higher,
                },
                text: {
                    color: colors.text.default.primary,
                },
            };
        default:
            return {
                container: {},
                text: {},
            };
    }
};

// =============================================================================
// Layout Padding Adjustments
// =============================================================================

const getLayoutPadding = (
    layout: ButtonLayout,
    size: ButtonSize
): { paddingLeft: number; paddingRight: number } => {
    const baseH = sizeConfig[size].paddingHorizontal;
    const iconAdjust = sizeConfig[size].iconPaddingAdjust;

    switch (layout) {
        case 'showLeadingIcon':
            return {
                paddingLeft: baseH - iconAdjust,
                paddingRight: baseH,
            };
        case 'showTrailingIcon':
            return {
                paddingLeft: baseH,
                paddingRight: baseH - iconAdjust,
            };
        case 'hasGuideLabel':
        case 'default':
        default:
            return {
                paddingLeft: baseH,
                paddingRight: baseH,
            };
    }
};

// =============================================================================
// Button Component
// =============================================================================

export const Button: React.FC<ButtonProps> = ({
    children,
    layout = 'default',
    variant = 'primary',
    size = 'medium',
    disabled = false,
    isLoading = false,
    leadingIcon,
    trailingIcon,
    guideLabel,
    style,
    ...pressableProps
}) => {
    const sizeStyles = sizeConfig[size];
    const variantStyles = getVariantStyles(variant, disabled);
    const layoutPadding = getLayoutPadding(layout, size);

    const showLeading = layout === 'showLeadingIcon' && leadingIcon;
    const showTrailing = layout === 'showTrailingIcon' && trailingIcon;
    const showGuide = layout === 'hasGuideLabel' && guideLabel;

    return (
        <Pressable
            disabled={disabled || isLoading}
            style={({ pressed }) => [
                styles.container,
                {
                    minHeight: sizeStyles.height,
                    paddingVertical: sizeStyles.paddingVertical,
                    paddingLeft: layoutPadding.paddingLeft,
                    paddingRight: layoutPadding.paddingRight,
                    borderRadius: radius.full,
                    opacity: pressed ? 0.8 : 1,
                },
                variantStyles.container,
                style,
            ]}
            {...pressableProps}
        >
            {isLoading ? (
                <ActivityIndicator
                    size="small"
                    color={variantStyles.text.color as string}
                />
            ) : (
                <View style={[styles.content, { gap: sizeStyles.gap }]}>
                    {/* Leading Icon */}
                    {showLeading && (
                        <View style={styles.iconContainer}>{leadingIcon}</View>
                    )}

                    {/* Text */}
                    <Text
                        style={[
                            styles.text,
                            sizeStyles.textStyle,
                            variantStyles.text,
                        ]}
                    >
                        {children}
                    </Text>

                    {/* Guide Label */}
                    {showGuide && (
                        <Text
                            style={[
                                styles.guideLabel,
                                typography.label.xs,
                                { color: variantStyles.text.color },
                            ]}
                        >
                            {guideLabel}
                        </Text>
                    )}

                    {/* Trailing Icon */}
                    {showTrailing && (
                        <View style={styles.iconContainer}>{trailingIcon}</View>
                    )}
                </View>
            )}
        </Pressable>
    );
};

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-start',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    text: {
        textAlign: 'center',
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    guideLabel: {
        opacity: 0.7,
    },
});

export default Button;
