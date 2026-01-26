/**
 * Erumi Design System - Navbar Component
 * Auto-generated from Figma Design System
 */
import * as React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, space, typography, radius } from '../tokens';

// =============================================================================
// Types
// =============================================================================

export type NavbarMenu = 'recommendation' | 'builder' | 'changeGuide' | 'profile';

export interface NavbarProps {
    /** Currently active menu */
    activeMenu: NavbarMenu;
    /** Callback when menu item is pressed */
    onMenuPress: (menu: NavbarMenu) => void;
}

// =============================================================================
// Menu Configuration
// =============================================================================

const menuConfig: Array<{
    key: NavbarMenu;
    label: string;
    icon: string;
}> = [
        {
            key: 'recommendation',
            label: '이름추천',
            icon: 'M17.0001 2.25H7.00006C5.48006 2.25 4.25006 3.48 4.25006 5V20C4.25006 20.96 5.03006 21.75 6.00006 21.75H18.9901C19.4101 21.75 19.7501 21.4 19.7501 20.98V5C19.7501 3.48 18.5201 2.25 17.0001 2.25ZM9.00006 6.25H15.0001C15.4101 6.25 15.7501 6.58 15.7501 7C15.7501 7.42 15.4101 7.75 15.0001 7.75H9.00006C8.59006 7.75 8.25006 7.41 8.25006 7C8.25006 6.59 8.59006 6.25 9.00006 6.25ZM18.2501 20.25H6.50006C6.09006 20.25 5.75006 19.91 5.75006 19.5C5.75006 19.09 6.09006 18.75 6.50006 18.75H18.2501V20.25ZM18.2501 17.25H6.50006C6.09006 17.25 5.75006 16.91 5.75006 16.5C5.75006 16.09 6.09006 15.75 6.50006 15.75H18.2501V17.25Z',
        },
        {
            key: 'builder',
            label: '셀프작명',
            icon: 'M21.0105 19.5859H9.9905L20.6305 8.94594C21.7005 7.87594 21.7005 6.13594 20.6305 5.05594L19.2105 3.64594C18.1405 2.56594 16.4005 2.56594 15.3205 3.64594L4.2305 14.7359C3.7705 15.1959 3.4905 15.7959 3.4305 16.4459L3.1805 19.1859C3.0905 20.1859 3.8605 21.0459 4.8505 21.0759C4.9005 21.0759 4.9505 21.0759 5.0005 21.0759H21.0005C21.4105 21.0759 21.7505 20.7459 21.7505 20.3259C21.7505 19.9059 21.4105 19.5759 21.0005 19.5759L21.0105 19.5859ZM16.3805 4.70594C16.8705 4.21594 17.6605 4.21594 18.1505 4.70594L19.5705 6.11594C20.0505 6.60594 20.0505 7.39594 19.5705 7.88594L18.6205 8.83594L15.4305 5.65594L16.3805 4.70594Z',
        },
        {
            key: 'changeGuide',
            label: '신청 가이드',
            icon: 'M18 3.25H15.66C15.57 2.76 15.35 2.06 14.83 1.44C14.24 0.75 13.33 0.25 12 0.25C10.67 0.25 9.76 0.75 9.17 1.44C8.65 2.06 8.43 2.76 8.33 3.25H6C4.48 3.25 3.25 4.48 3.25 6V20C3.25 21.52 4.48 22.75 6 22.75H12C12.41 22.75 12.75 22.41 12.75 22C12.75 19.79 13.54 18.27 14.78 17.28C16.04 16.27 17.86 15.75 20 15.75C20.2 15.75 20.39 15.67 20.53 15.53C20.67 15.39 20.75 15.2 20.75 15V6C20.75 4.48 19.52 3.25 18 3.25ZM9.88 3.25C9.96 2.97 10.1 2.67 10.32 2.41C10.61 2.07 11.1 1.75 12 1.75C12.9 1.75 13.39 2.07 13.68 2.41C13.9 2.67 14.04 2.97 14.12 3.25H9.88Z',
            // Note: changeGuide has a second path for checkmark, handled separately
        },
        {
            key: 'profile',
            label: '내 정보',
            icon: 'M12 1.2771C6.08103 1.2771 1.27722 6.0809 1.27722 11.9999C1.27722 14.2946 2.00637 16.4284 3.23949 18.1762C3.31455 18.0904 3.48611 17.8867 3.77563 17.6293C3.92575 17.4899 4.11876 17.3184 4.35466 17.1575C5.64139 16.1818 8.09691 14.895 12 14.895C15.9031 14.895 18.3586 16.1818 19.6453 17.1575C19.8812 17.3184 20.0743 17.4899 20.2244 17.6293C20.5139 17.8867 20.6854 18.0904 20.7605 18.1762C21.9936 16.4284 22.7228 14.2946 22.7228 11.9999C22.7228 6.0809 17.919 1.2771 12 1.2771ZM12 12.7397C9.9305 12.7397 8.25775 11.067 8.25775 9.00822C8.25775 8.6222 8.31136 8.24691 8.42931 7.89305C8.45076 7.7751 8.49365 7.65715 8.54727 7.54993C8.64377 7.32475 8.76172 7.11029 8.89039 6.91728C9.02979 6.71355 9.17991 6.53126 9.35147 6.3597C10.027 5.68416 10.9706 5.26597 12 5.26597C13.0294 5.26597 13.973 5.68416 14.6485 6.3597C14.8201 6.53126 14.9702 6.71355 15.1096 6.91728C15.249 7.11029 15.367 7.32475 15.4527 7.54993C15.5063 7.65715 15.5492 7.7751 15.5707 7.89305C15.6886 8.24691 15.7422 8.6222 15.7422 9.00822C15.7422 11.067 14.0695 12.7397 12 12.7397Z',
        },
    ];

// Additional paths for complex icons
const profilePaths = {
    innerCircle: 'M12 6.43506C10.5739 6.43506 9.42651 7.5824 9.42651 9.00853C9.42651 10.4347 10.5739 11.582 12 11.582C13.4261 11.582 14.5734 10.4239 14.5734 9.00853C14.5734 7.59312 13.4261 6.43506 12 6.43506Z',
    bottomArc: 'M19.2915 18.7876C19.1521 18.659 18.9483 18.4874 18.7124 18.3158C17.6187 17.5009 15.4849 16.3857 12 16.3857C8.51507 16.3857 6.38124 17.4902 5.28751 18.3158C5.05161 18.4874 4.84788 18.659 4.70848 18.7876C4.49403 18.9807 4.39752 19.1201 4.37608 19.1415C4.31174 19.2166 4.23668 19.2809 4.16162 19.3238C6.12389 21.4147 8.91181 22.7229 12 22.7229C15.0881 22.7229 17.8761 21.4147 19.8383 19.3238C19.7633 19.2809 19.6775 19.2273 19.6239 19.1415C19.6024 19.1201 19.5059 18.9807 19.2915 18.7876Z',
};

const changeGuideCheckPath = 'M21.9699 16.9699C22.2599 16.6799 22.7399 16.6799 23.0299 16.9699C23.3199 17.2599 23.3199 17.7399 23.0299 18.0299L18.0299 23.0299C17.7399 23.3199 17.2599 23.3199 16.9699 23.0299L14.9699 21.0299C14.6799 20.7399 14.6799 20.2599 14.9699 19.9699C15.2599 19.6799 15.7399 19.6799 16.0299 19.9699L17.4999 21.4399L21.9699 16.9699Z';

// =============================================================================
// NavbarIcon Component
// =============================================================================

interface NavbarIconProps {
    menu: NavbarMenu;
    isActive: boolean;
}

const NavbarIcon: React.FC<NavbarIconProps> = ({ menu, isActive }) => {
    const config = menuConfig.find(m => m.key === menu);
    if (!config) return null;

    const fillColor = isActive
        ? colors.primitives.neutral[0] // 흰색 (r:1, g:1, b:1)
        : colors.primitives.neutral[500]; // 회색 (r:0.45 = #737373)

    if (menu === 'profile') {
        return (
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path d={profilePaths.bottomArc} fill={fillColor} />
                <Path d={config.icon} fill={fillColor} />
                <Path d={profilePaths.innerCircle} fill={fillColor} />
            </Svg>
        );
    }

    if (menu === 'changeGuide') {
        return (
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path d={config.icon} fill={fillColor} />
                <Path d={changeGuideCheckPath} fill={fillColor} />
            </Svg>
        );
    }

    return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d={config.icon} fill={fillColor} />
        </Svg>
    );
};

// =============================================================================
// NavbarItem Component
// =============================================================================

interface NavbarItemProps {
    menu: NavbarMenu;
    label: string;
    isActive: boolean;
    onPress: () => void;
}

const NavbarItem: React.FC<NavbarItemProps> = ({ menu, label, isActive, onPress }) => {
    return (
        <Pressable style={styles.item} onPress={onPress}>
            <NavbarIcon menu={menu} isActive={isActive} />
            <Text style={[
                styles.label,
                isActive && styles.labelActive,
            ]}>
                {label}
            </Text>
        </Pressable>
    );
};

// =============================================================================
// Navbar Component
// =============================================================================

export const Navbar: React.FC<NavbarProps> = ({ activeMenu, onMenuPress }) => {
    return (
        <View style={styles.container}>
            {menuConfig.map(item => (
                <NavbarItem
                    key={item.key}
                    menu={item.key}
                    label={item.label}
                    isActive={activeMenu === item.key}
                    onPress={() => onMenuPress(item.key)}
                />
            ))}
        </View>
    );
};

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        height: 73,
        paddingVertical: space[300], // 12
        paddingHorizontal: space[600], // 24
        gap: space[400], // 16
        backgroundColor: colors.primitives.neutral[1000], // 검정
        borderRadius: radius.full, // 9999 (pill shape)
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    item: {
        flex: 1,
        alignItems: 'center',
        gap: space[100], // 4
    },
    label: {
        ...typography.label.xsSemiBold, // fontSize 11, SemiBold (Figma fontWeight: 600)
        color: colors.primitives.neutral[500], // inactive: 회색 (r:0.45)
    },
    labelActive: {
        color: colors.primitives.neutral[0], // active: 흰색 (r:1)
    },
});

export default Navbar;
