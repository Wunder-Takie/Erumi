/**
 * Erumi Design System - Typography Primitives
 * Auto-generated from Figma Variables
 */

// React Native requires separate font family names for each weight
export const fontFamily = {
    pretendard: 'Pretendard-Regular',
    pretendardMedium: 'Pretendard-Medium',
    pretendardSemiBold: 'Pretendard-SemiBold',
    pretendardBold: 'Pretendard-Bold',
} as const;

/** Font size scale (01 = 10px, 16 = 52px) */
export const fontScale = {
    '01': 10,
    '02': 11,
    '03': 13,
    '04': 14,
    '05': 16,
    '06': 18,
    '07': 20,
    '08': 23,
    '09': 26,
    '10': 29,
    '11': 29,
    '12': 36,
    '13': 36,
    '14': 41,
    '15': 46,
    '16': 52,
} as const;

/** Font weights */
export const fontWeight = {
    thin: '100',
    extraLight: '200',
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
    black: '900',
} as const;

/** Line heights by typography style */
export const lineHeight = {
    labelXs: 13,
    labelSm: 16,
    labelMd: 18,
    labelLg: 20,
    labelXlg: 22,
    captionMd: 22,
    bodyMd: 18,
    bodyLg: 20,
    titleMd: 20,
    titleLg: 20,
    headingMd: 26,
    headingLg: 28,
    displayMd: 32,
    displayLg: 36,
    displayXlg: 42,
    displayXxlg: 48,
} as const;

/** Letter spacing (tracking) */
export const tracking = {
    base: 0,
    snug: -0.1,
    tight: -0.24,
    tighter: -0.28,
    tightest: -0.64,
} as const;

export type FontFamily = keyof typeof fontFamily;
export type FontScale = keyof typeof fontScale;
export type FontWeight = keyof typeof fontWeight;
export type LineHeight = keyof typeof lineHeight;
export type Tracking = keyof typeof tracking;
