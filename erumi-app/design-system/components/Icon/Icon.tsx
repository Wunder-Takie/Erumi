/**
 * Erumi Design System - Icon Component
 * Auto-generated from Figma Design System
 */
import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';
import { iconPaths, IconName } from './iconPaths';
import { colors, border } from '../../tokens';

// =============================================================================
// Types
// =============================================================================

export type IconSize = 16 | 20 | 24 | 40;
export type IconStyle = 'outline' | 'solid';

export interface IconProps {
    /** Icon name from the design system */
    name: IconName;
    /** Icon size in pixels */
    size?: IconSize;
    /** Icon style variant */
    iconStyle?: IconStyle;
    /** Icon color - defaults to primary icon color */
    color?: string;
    /** Custom container style */
    style?: ViewStyle;
}

// =============================================================================
// Size to StrokeWidth mapping
// =============================================================================

// 모든 사이즈에서 동일한 strokeWidth 사용 (viewBox 스케일링이 자동으로 두께 조절)
// Size 16: 1.5 * (16/24) = 1.0 visual
// Size 20: 1.5 * (20/24) = 1.25 visual
// Size 24: 1.5 * (24/24) = 1.5 visual
// Size 40: 1.5 * (40/24) = 2.5 visual
const STROKE_WIDTH = border.default; // 1.5

// =============================================================================
// Icon Component
// =============================================================================

export const Icon: React.FC<IconProps> = ({
    name,
    size = 24,
    iconStyle = 'outline',
    color = colors.icon.default.primary,
    style,
}) => {
    const paths = iconPaths[name];

    if (!paths) {
        console.warn(`Icon "${name}" not found in design system`);
        return null;
    }

    const pathData = paths[iconStyle];
    const strokeWidth = STROKE_WIDTH;
    const isOutline = iconStyle === 'outline';

    return (
        <Svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            style={style}
        >
            <Path
                d={pathData}
                stroke={isOutline ? color : 'none'}
                strokeWidth={isOutline ? strokeWidth : 0}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill={isOutline ? 'none' : color}
                fillRule="evenodd"
                clipRule="evenodd"
            />
        </Svg>
    );
};

// =============================================================================
// Re-exports
// =============================================================================

export { IconName, iconNames } from './iconPaths';
export default Icon;
