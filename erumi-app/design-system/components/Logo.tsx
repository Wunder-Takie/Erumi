/**
 * Erumi Design System - Logo Component
 * Auto-generated from Figma Design System
 */
import * as React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { ViewStyle } from 'react-native';
import { colors } from '../tokens';

// =============================================================================
// Types
// =============================================================================

export type LogoSize = 'small' | 'medium';

export interface LogoProps {
    /** Logo size variant */
    size?: LogoSize;
    /** Custom color - defaults to primary text color */
    color?: string;
    /** Custom container style */
    style?: ViewStyle;
}

// =============================================================================
// Size Configurations
// =============================================================================

const sizeConfig = {
    small: {
        width: 84,
        height: 31,
        viewBox: '0 0 84 31',
        strokeWidth: 4.00215,
        circleR: 2.53009,
        circleCx: 81.4699,
        circleCy: 6.58168,
        path: 'M2.02524 13.039C2.02524 13.039 5.06262 16.814 14.0201 16.4165C21.7903 16.0717 27.9887 13.6943 24.826 7.60164C21.1746 0.567569 7.82651 10.1462 13.2294 25.7499C19.0277 37.4334 34.2022 6.02672 34.6624 2.26435C34.8063 1.08775 34.6763 4.58507 34.5802 6.39141C34.5097 7.71491 34.7317 27.6774 33.7498 27.8349C30.3064 28.387 42.6435 1.27783 42.527 2.66213C42.0766 8.00989 39.6887 22.7695 46.5354 25.3443C46.884 25.4753 52.4147 12.4566 53.2194 11.4179C54.6715 9.54355 55.5442 27.4308 57.0477 26.8725C58.7425 26.2431 62.2302 12.7576 64.1978 10.1462C64.8709 9.25297 64.0432 36.5607 75.3823 13.0392C75.5471 12.6974 78.9736 20.4559 79.3768 21.2871C80.0913 22.7601 80.8804 13.9775 80.9639 12.9801',
    },
    medium: {
        width: 148,
        height: 56,
        viewBox: '0 0 148 56',
        strokeWidth: 7.20388,
        circleR: 4.01078,
        circleCx: 143.989,
        circleCy: 12.6404,
        path: 'M3.61182 23.7575C3.61182 23.7575 9.01322 30.6624 24.9424 29.9353C38.7603 29.3046 49.7829 24.956 44.1587 13.8119C37.6653 0.94573 13.9283 18.4662 23.5364 47.0072C33.8475 68.3777 60.8323 10.9312 61.6508 4.04934C61.9067 1.8972 61.6756 8.29421 61.5045 11.5982C61.3792 14.0191 61.774 50.5328 60.0278 50.8208C53.9044 51.8308 75.8438 2.24488 75.6365 4.77692C74.8356 14.5586 70.5891 41.5557 82.7647 46.2653C83.3845 46.505 93.2199 22.6922 94.6508 20.7923C97.2332 17.3639 98.7851 50.0817 101.459 49.0605C104.473 47.9094 110.675 23.2427 114.174 18.4662C115.371 16.8324 113.899 66.7814 134.063 23.7578C134.356 23.1327 140.45 37.3238 141.167 38.8442C142.438 41.5384 143.841 25.4741 143.989 23.6497',
    },
} as const;

// =============================================================================
// Logo Component
// =============================================================================

export const Logo: React.FC<LogoProps> = ({
    size = 'medium',
    color = colors.text.default.primary,
    style,
}) => {
    const config = sizeConfig[size];

    return (
        <Svg
            width={config.width}
            height={config.height}
            viewBox={config.viewBox}
            fill="none"
            style={style}
        >
            <Path
                d={config.path}
                stroke={color}
                strokeWidth={config.strokeWidth}
                strokeLinecap="round"
            />
            <Circle
                cx={config.circleCx}
                cy={config.circleCy}
                r={config.circleR}
                fill={color}
            />
        </Svg>
    );
};

export default Logo;
