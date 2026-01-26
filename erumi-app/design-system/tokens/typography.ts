/**
 * Erumi Design System - Typography Styles
 * Auto-generated from Figma Variables
 */
import { TextStyle } from 'react-native';
import { fontFamily, lineHeight, tracking } from './typographyPrimitives';

type TypographyStyle = Pick<TextStyle, 'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing'>;

/** Caption typography */
export const caption: Record<string, TypographyStyle> = {
    md: {
        fontFamily: fontFamily.pretendard, // Regular
        fontSize: 11,
        lineHeight: lineHeight.captionMd,
        letterSpacing: tracking.base,
    },
} as const;

/** Label typography */
export const label: Record<string, TypographyStyle> = {
    // Base (Medium)
    xs: {
        fontFamily: fontFamily.pretendardMedium,
        fontSize: 11,
        lineHeight: lineHeight.labelXs,
        letterSpacing: tracking.base,
    },
    sm: {
        fontFamily: fontFamily.pretendardMedium,
        fontSize: 13,
        lineHeight: lineHeight.labelSm,
        letterSpacing: tracking.base,
    },
    md: {
        fontFamily: fontFamily.pretendardMedium,
        fontSize: 14,
        lineHeight: lineHeight.labelMd,
        letterSpacing: tracking.base,
    },
    lg: {
        fontFamily: fontFamily.pretendardMedium,
        fontSize: 16,
        lineHeight: lineHeight.labelLg,
        letterSpacing: tracking.base,
    },
    xlg: {
        fontFamily: fontFamily.pretendardMedium,
        fontSize: 18,
        lineHeight: lineHeight.labelLg,
        letterSpacing: tracking.base,
    },
    // SemiBold variants
    xsSemiBold: {
        fontFamily: fontFamily.pretendardSemiBold,
        fontSize: 11,
        lineHeight: lineHeight.labelXs,
        letterSpacing: tracking.base,
    },
    smSemiBold: {
        fontFamily: fontFamily.pretendardSemiBold,
        fontSize: 13,
        lineHeight: lineHeight.labelSm,
        letterSpacing: tracking.base,
    },
    mdSemiBold: {
        fontFamily: fontFamily.pretendardSemiBold,
        fontSize: 14,
        lineHeight: lineHeight.labelMd,
        letterSpacing: tracking.base,
    },
    lgSemiBold: {
        fontFamily: fontFamily.pretendardSemiBold,
        fontSize: 16,
        lineHeight: lineHeight.labelLg,
        letterSpacing: tracking.base,
    },
    xlgSemiBold: {
        fontFamily: fontFamily.pretendardSemiBold,
        fontSize: 18,
        lineHeight: lineHeight.labelLg,
        letterSpacing: tracking.base,
    },
    // Bold variants
    xsBold: {
        fontFamily: fontFamily.pretendardBold,
        fontSize: 11,
        lineHeight: lineHeight.labelXs,
        letterSpacing: tracking.base,
    },
    smBold: {
        fontFamily: fontFamily.pretendardBold,
        fontSize: 13,
        lineHeight: lineHeight.labelSm,
        letterSpacing: tracking.base,
    },
    mdBold: {
        fontFamily: fontFamily.pretendardBold,
        fontSize: 14,
        lineHeight: lineHeight.labelMd,
        letterSpacing: tracking.base,
    },
    lgBold: {
        fontFamily: fontFamily.pretendardBold,
        fontSize: 16,
        lineHeight: lineHeight.labelLg,
        letterSpacing: tracking.base,
    },
    xlgBold: {
        fontFamily: fontFamily.pretendardBold,
        fontSize: 18,
        lineHeight: lineHeight.labelLg,
        letterSpacing: tracking.base,
    },
} as const;

/** Body typography - Regular weight */
export const body: Record<string, TypographyStyle> = {
    md: {
        fontFamily: fontFamily.pretendard,
        fontSize: 14,
        lineHeight: lineHeight.bodyMd,
        letterSpacing: tracking.base,
    },
    lg: {
        fontFamily: fontFamily.pretendard,
        fontSize: 16,
        lineHeight: lineHeight.bodyLg,
        letterSpacing: tracking.base,
    },
} as const;

/** Title typography - SemiBold weight */
export const title: Record<string, TypographyStyle> = {
    md: {
        fontFamily: fontFamily.pretendardSemiBold,
        fontSize: 16,
        lineHeight: lineHeight.titleMd,
        letterSpacing: tracking.snug,
    },
    lg: {
        fontFamily: fontFamily.pretendardSemiBold,
        fontSize: 18,
        lineHeight: lineHeight.titleLg,
        letterSpacing: tracking.snug,
    },
    xlg: {
        fontFamily: fontFamily.pretendardSemiBold,
        fontSize: 20,
        lineHeight: lineHeight.titleLg,
        letterSpacing: tracking.snug,
    },
} as const;

/** Heading typography - Bold weight */
export const heading: Record<string, TypographyStyle> = {
    md: {
        fontFamily: fontFamily.pretendardBold,
        fontSize: 20,
        lineHeight: lineHeight.headingMd,
        letterSpacing: tracking.tight,
    },
    lg: {
        fontFamily: fontFamily.pretendardBold,
        fontSize: 23,
        lineHeight: lineHeight.headingLg,
        letterSpacing: tracking.tight,
    },
} as const;

/** Display typography - Bold weight */
export const display: Record<string, TypographyStyle> = {
    md: {
        fontFamily: fontFamily.pretendardBold,
        fontSize: 26,
        lineHeight: lineHeight.displayMd,
        letterSpacing: tracking.tighter,
    },
    lg: {
        fontFamily: fontFamily.pretendardBold,
        fontSize: 29,
        lineHeight: lineHeight.displayLg,
        letterSpacing: tracking.tighter,
    },
    xlg: {
        fontFamily: fontFamily.pretendardBold,
        fontSize: 36,
        lineHeight: lineHeight.displayXlg,
        letterSpacing: tracking.tightest,
    },
    xxlg: {
        fontFamily: fontFamily.pretendardBold,
        fontSize: 41,
        lineHeight: lineHeight.displayXxlg,
        letterSpacing: tracking.tightest,
    },
} as const;

/** Combined typography styles */
export const typography = {
    caption,
    label,
    body,
    title,
    heading,
    display,
} as const;

export type TypographyCategory = keyof typeof typography;
