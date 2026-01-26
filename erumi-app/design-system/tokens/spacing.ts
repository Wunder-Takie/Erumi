/**
 * Erumi Design System - Spacing, Radius, Border, Icon Sizes
 * Auto-generated from Figma Variables
 */

/** Spacing scale */
export const space = {
    0: 0,
    50: 2,
    100: 4,
    150: 6,
    200: 8,
    300: 12,
    400: 16,
    500: 20,
    600: 24,
    800: 32,
    1200: 48,
    1600: 64,
    2400: 96,
    4000: 160,
    // Negative values
    neg100: -4,
    neg200: -8,
    neg300: -12,
    neg400: -16,
    neg600: -24,
} as const;

/** Border radius scale */
export const radius = {
    100: 4,
    150: 6,
    200: 8,
    250: 10,
    300: 12,
    350: 14,
    400: 16,
    500: 20,
    600: 24,
    700: 28,
    800: 32,
    1000: 40,
    1200: 48,
    1400: 56,
    1600: 64,
    full: 9999,
} as const;

/** Border width scale */
export const border = {
    thinest: 1,
    thin: 1.25,
    default: 1.5,
    thick: 2,
    thickest: 2.5,
} as const;

/** Icon sizes */
export const iconSize = {
    mini: 20,
    small: 24,
    medium: 32,
    large: 40,
} as const;

export type Space = keyof typeof space;
export type Radius = keyof typeof radius;
export type Border = keyof typeof border;
export type IconSizeToken = keyof typeof iconSize;
