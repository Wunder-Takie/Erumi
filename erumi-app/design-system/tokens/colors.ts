/**
 * Erumi Design System - Semantic Colors
 * Auto-generated from Figma Variables
 * Updated: 2026-01-27
 */
import { colorPrimitives } from './colorPrimitives';

/** Background colors */
export const backgroundColors = {
    default: {
        sky: colorPrimitives.sand[0],
        highest: colorPrimitives.sand[50],
        higher: colorPrimitives.sand[100],
        high: colorPrimitives.sand[200],
        low: colorPrimitives.sand[500],
        lower: colorPrimitives.sand[600],
        lowest: colorPrimitives.sand[700],
        ground: colorPrimitives.sand[800],
    },
    accent: {
        primary: colorPrimitives.sky[400],
        secondary: colorPrimitives.orange[300],
        onPrimary: colorPrimitives.sky[1000],
    },
    neutral: {
        primary: colorPrimitives.neutral[1000],
        secondary: colorPrimitives.neutral[500],
        onPrimary: colorPrimitives.neutral[0],
    },
    element: {
        wood: colorPrimitives.green[300],
        fire: colorPrimitives.red[300],
        earth: colorPrimitives.sand[400],
        metal: colorPrimitives.neutral[400],
        water: colorPrimitives.blue[300],
    },
    info: {
        primary: colorPrimitives.blue[300],
        secondary: colorPrimitives.blue[100],
    },
    danger: {
        primary: colorPrimitives.red[300],
        secondary: colorPrimitives.red[100],
    },
    success: {
        primary: colorPrimitives.green[300],
        secondary: colorPrimitives.green[100],
    },
    warning: {
        primary: colorPrimitives.orange[300],
        secondary: colorPrimitives.orange[100],
    },
    utilities: {
        overlay: 'rgba(18, 16, 14, 0.4)',
        overlayStrong: 'rgba(18, 16, 14, 0.6)',
    },
    disabled: {
        default: colorPrimitives.sand[200],
        accent: colorPrimitives.sky[200],
        neutral: colorPrimitives.neutral[200],
    },
} as const;

/** Icon colors */
export const iconColors = {
    default: {
        primary: colorPrimitives.sand[800],
        onPrimary: colorPrimitives.sand[100],
        secondary: colorPrimitives.sand[500],
        tertiary: colorPrimitives.sand[400],
    },
    accent: {
        primary: colorPrimitives.sky[400],
        secondary: colorPrimitives.orange[300],
        onPrimary: colorPrimitives.sky[1000],
    },
    neutral: {
        primary: colorPrimitives.neutral[1000],
        secondary: colorPrimitives.neutral[500],
        onPrimary: colorPrimitives.neutral[0],
    },
    element: {
        wood: colorPrimitives.green[600],
        fire: colorPrimitives.red[500],
        earth: colorPrimitives.sand[600],
        metal: colorPrimitives.neutral[600],
        water: colorPrimitives.blue[500],
    },
    info: {
        primary: colorPrimitives.blue[500],
        secondary: colorPrimitives.blue[300],
    },
    danger: {
        primary: colorPrimitives.red[500],
        secondary: colorPrimitives.red[300],
    },
    success: {
        primary: colorPrimitives.green[500],
        secondary: colorPrimitives.green[300],
    },
    warning: {
        primary: colorPrimitives.orange[500],
        secondary: colorPrimitives.orange[300],
    },
    disabled: {
        default: colorPrimitives.sand[400],
        accent: colorPrimitives.sky[400],
        neutral: colorPrimitives.neutral[400],
    },
} as const;

/** Text colors */
export const textColors = {
    default: {
        primary: colorPrimitives.sand[800],
        onPrimary: colorPrimitives.sand[100],
        secondary: colorPrimitives.sand[600],
        tertiary: colorPrimitives.sand[500],
    },
    neutral: {
        primary: colorPrimitives.neutral[1000],
        secondary: colorPrimitives.neutral[500],
        onPrimary: colorPrimitives.neutral[0],
    },
    element: {
        wood: colorPrimitives.green[600],
        fire: colorPrimitives.red[500],
        earth: colorPrimitives.sand[600],
        metal: colorPrimitives.neutral[600],
        water: colorPrimitives.blue[500],
    },
    info: {
        primary: colorPrimitives.blue[600],
    },
    danger: {
        primary: colorPrimitives.red[600],
    },
    success: {
        primary: colorPrimitives.green[600],
    },
    warning: {
        primary: colorPrimitives.orange[600],
    },
    disabled: {
        default: colorPrimitives.sand[400],
        accent: colorPrimitives.sky[400],
        neutral: colorPrimitives.neutral[400],
    },
} as const;

/** Border colors */
export const borderColors = {
    default: {
        primary: colorPrimitives.sand[800],
        onPrimary: colorPrimitives.sand[50],
        weak: colorPrimitives.sand[100],
        medium: colorPrimitives.sand[300],
        strong: colorPrimitives.sand[500],
        strongest: colorPrimitives.sand[700],
    },
    neutral: {
        primary: colorPrimitives.neutral[1000],
        secondary: colorPrimitives.neutral[500],
        onPrimary: colorPrimitives.neutral[0],
    },
    element: {
        wood: colorPrimitives.green[600],
        fire: colorPrimitives.red[500],
        earth: colorPrimitives.sand[600],
        metal: colorPrimitives.neutral[600],
        water: colorPrimitives.blue[500],
    },
    info: {
        primary: colorPrimitives.blue[500],
        secondary: colorPrimitives.blue[100],
    },
    danger: {
        primary: colorPrimitives.red[500],
        secondary: colorPrimitives.red[100],
    },
    success: {
        primary: colorPrimitives.green[500],
        secondary: colorPrimitives.green[100],
    },
    warning: {
        primary: colorPrimitives.orange[500],
        secondary: colorPrimitives.orange[100],
    },
    disabled: {
        default: colorPrimitives.sand[200],
        accent: colorPrimitives.sky[200],
        neutral: colorPrimitives.neutral[200],
    },
} as const;

/** Combined semantic colors */
export const colors = {
    background: backgroundColors,
    icon: iconColors,
    text: textColors,
    border: borderColors,
    primitives: colorPrimitives,
} as const;

export type BackgroundColorCategory = keyof typeof backgroundColors;
export type IconColorCategory = keyof typeof iconColors;
export type TextColorCategory = keyof typeof textColors;
export type BorderColorCategory = keyof typeof borderColors;
