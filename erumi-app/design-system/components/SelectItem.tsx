/**
 * Erumi Design System - SelectItem Component
 * Selectable item with various layouts
 */
import * as React from 'react';
import { View, Text, Pressable, Image, StyleSheet, ViewStyle, ImageSourcePropType } from 'react-native';
import { colors, space, radius, typography } from '../tokens';
import { Icon } from './Icon';

// =============================================================================
// Types
// =============================================================================

export type SelectItemStatus = 'small' | 'medium' | 'hasSecondLabel' | 'hasBodyLabel' | 'hasImage';

export interface SelectItemProps {
    /** Item layout variant */
    status: SelectItemStatus;
    /** Whether the item is selected */
    selected?: boolean;
    /** Primary label text */
    label: string;
    /** Secondary label (for hasSecondLabel status) */
    secondLabel?: string;
    /** Body label (for hasBodyLabel status) */
    bodyLabel?: string;
    /** Image source (for hasImage status) */
    imageSource?: ImageSourcePropType;
    /** Show close button (for small/medium status) */
    showCloseButton?: boolean;
    /** Show trailing icon (for hasSecondLabel/hasBodyLabel status) */
    showTrailingIcon?: boolean;
    /** Disable press visual effect (for instant dialogs) */
    disablePressEffect?: boolean;
    /** Close button press handler */
    onClosePress?: () => void;
    /** Press handler */
    onPress?: () => void;
    /** Custom style */
    style?: ViewStyle;
}

// =============================================================================
// SelectItem Component
// =============================================================================

export const SelectItem: React.FC<SelectItemProps> = ({
    status,
    selected = false,
    label,
    secondLabel,
    bodyLabel,
    imageSource,
    showCloseButton = false,
    showTrailingIcon = true,
    disablePressEffect = false,
    onClosePress,
    onPress,
    style,
}) => {
    const containerStyle = [
        styles.container,
        status === 'small' && styles.containerSmall,
        status === 'medium' && styles.containerMedium,
        status === 'hasSecondLabel' && styles.containerHasSecondLabel,
        status === 'hasImage' && styles.containerHasImage,
        selected ? styles.containerSelected : styles.containerDefault,
        style,
    ];

    const isHorizontalLayout = status === 'hasSecondLabel' || status === 'hasBodyLabel' || status === 'hasImage';

    return (
        <Pressable
            style={containerStyle}
            onPress={onPress}
            unstable_pressDelay={disablePressEffect ? 9999 : 0}
        >
            {/* Close Button (for small/medium when showCloseButton=true) */}
            {(status === 'small' || status === 'medium') && showCloseButton && (
                <Pressable style={styles.closeButton} onPress={onClosePress}>
                    <Icon name="X Mark" size={20} color={colors.primitives.sand[600]} />
                </Pressable>
            )}

            {/* Image (for hasImage status) */}
            {status === 'hasImage' && imageSource && (
                <View style={styles.imageWrapper}>
                    <Image source={imageSource} style={styles.image} />
                </View>
            )}

            {/* Text Group */}
            <View style={[
                styles.textGroup,
                (status === 'hasBodyLabel' || status === 'hasImage') && styles.textGroupVertical,
            ]}>
                <Text style={styles.primaryLabel}>{label}</Text>

                {status === 'hasSecondLabel' && secondLabel && (
                    <Text style={styles.secondLabel}>{secondLabel}</Text>
                )}

                {(status === 'hasBodyLabel' || status === 'hasImage') && bodyLabel && (
                    <Text style={[
                        styles.bodyLabel,
                        selected && styles.bodyLabelSelected,
                    ]}>{bodyLabel}</Text>
                )}
            </View>

            {/* Trailing Icon (for hasSecondLabel, hasBodyLabel) */}
            {showTrailingIcon && (status === 'hasSecondLabel' || status === 'hasBodyLabel') && (
                <View style={styles.trailingIcon}>
                    <Icon
                        name="arrowRight"
                        size={20}
                        color={selected ? colors.primitives.sand[800] : colors.primitives.sand[500]}
                    />
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
        paddingVertical: space[400], // 16 (Figma updated)
        paddingHorizontal: space[500], // 20
        borderRadius: radius[600], // 24
        gap: space[200], // 8
        flexDirection: 'row', // default for hasSecondLabel, hasBodyLabel, hasImage
        alignItems: 'center',
        justifyContent: 'center',
    },
    containerSmall: {
        minHeight: 48, // Figma height
        borderRadius: radius[400], // 16
        flexDirection: 'column', // VERTICAL
        alignItems: 'center',
        justifyContent: 'center',
    },
    containerMedium: {
        minHeight: 64, // Figma height
        flexDirection: 'column', // VERTICAL
        alignItems: 'center',
        justifyContent: 'center',
    },
    containerHasSecondLabel: {
        minHeight: 64, // Figma height
    },
    containerHasImage: {
        gap: space[400], // 16 (updated)
    },
    closeButton: {
        position: 'absolute',
        top: -8, // Figma: offsetY -8
        right: -8, // Figma: 오른쪽 상단
        width: 28, // Figma
        height: 28, // Figma
        padding: space[100], // 4
        borderRadius: radius.full, // 9999 (원형)
        backgroundColor: colors.primitives.sand[200], // #E8DEC8
        borderWidth: 2.5, // Figma strokeWeight
        borderColor: colors.primitives.sand[50], // #FCF8F0
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    containerDefault: {
        backgroundColor: colors.primitives.sand[100], // #F4ECDD
    },
    containerSelected: {
        backgroundColor: colors.primitives.orange[300], // #FFB561
    },

    // Image
    imageWrapper: {
        width: 64, // Figma
        height: 80, // Figma
        borderRadius: radius[400], // 16 (Figma)
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },

    // Text Group
    textGroup: {
        flexDirection: 'row',
        gap: space[100], // 4
        alignItems: 'center',
        flex: 1,
    },
    textGroupVertical: {
        flexDirection: 'column',
        alignItems: 'flex-start',
    },

    // Labels
    primaryLabel: {
        ...typography.body.md,
        fontFamily: 'Pretendard-SemiBold', // fontWeight 600
        fontSize: 16,
        lineHeight: 24, // Increased for emoji support (prevents clipping)
        color: colors.primitives.sand[800], // #332C21
    },
    secondLabel: {
        ...typography.label.md,
        fontSize: 14,
        color: colors.primitives.sand[800], // #332C21
    },
    bodyLabel: {
        ...typography.label.md,
        fontSize: 14,
        color: colors.primitives.sand[500], // #92846D (default)
    },
    bodyLabelSelected: {
        color: colors.primitives.sand[600], // #6D614C (selected)
    },

    // Trailing Icon
    trailingIcon: {
        width: 20, // Figma
        height: 20, // Figma
    },
});

export default SelectItem;
