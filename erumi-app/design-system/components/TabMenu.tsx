/**
 * Erumi Design System - TabMenu Component
 * 탭 메뉴 컴포넌트 - 슬라이드 인디케이터 애니메이션 지원
 */
import * as React from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    ViewStyle,
    Animated,
    LayoutChangeEvent,
} from 'react-native';
import { colors, typography, space, radius } from '../tokens';

// =============================================================================
// Types
// =============================================================================

export interface TabItem {
    /** 탭 ID (고유 식별자) */
    id: string;
    /** 탭 라벨 */
    label: string;
}

export interface TabMenuProps {
    /** 탭 아이템 목록 */
    items: TabItem[];
    /** 현재 선택된 탭 ID */
    selectedId: string;
    /** 탭 선택 시 콜백 */
    onSelect: (id: string) => void;
    /** 탭 레이아웃 변경 시 콜백 (자동 스크롤용) */
    onTabLayout?: (id: string, layout: { x: number; width: number }) => void;
    /** Custom container style */
    style?: ViewStyle;
}

// =============================================================================
// Constants
// =============================================================================

const GAP = 4;
const PADDING = space[300]; // 12px
const CORNER_RADIUS = radius[300]; // 12px
const ANIMATION_DURATION = 200;

// =============================================================================
// TabMenu Component
// =============================================================================

export const TabMenu: React.FC<TabMenuProps> = ({
    items,
    selectedId,
    onSelect,
    onTabLayout,
    style,
}) => {
    // 각 탭의 위치와 너비를 저장
    const tabLayouts = React.useRef<{ [key: string]: { x: number; width: number } }>({});
    const indicatorPosition = React.useRef(new Animated.Value(0)).current;
    const indicatorWidth = React.useRef(new Animated.Value(0)).current;
    const [isReady, setIsReady] = React.useState(false);

    // 선택된 탭이 변경될 때 인디케이터 애니메이션
    React.useEffect(() => {
        const layout = tabLayouts.current[selectedId];
        if (layout) {
            Animated.parallel([
                Animated.spring(indicatorPosition, {
                    toValue: layout.x,
                    tension: 300,
                    friction: 20,
                    useNativeDriver: false,
                }),
                Animated.spring(indicatorWidth, {
                    toValue: layout.width,
                    tension: 300,
                    friction: 20,
                    useNativeDriver: false,
                }),
            ]).start();
        }
    }, [selectedId, isReady]);

    // 탭 레이아웃 측정
    const handleTabLayout = (id: string, event: LayoutChangeEvent) => {
        const { x, width } = event.nativeEvent.layout;
        tabLayouts.current[id] = { x, width };

        // 부모에게 탭 레이아웃 전달 (자동 스크롤용)
        onTabLayout?.(id, { x, width });

        // 모든 탭이 측정되면 초기 위치 설정
        if (Object.keys(tabLayouts.current).length === items.length && !isReady) {
            const initialLayout = tabLayouts.current[selectedId];
            if (initialLayout) {
                indicatorPosition.setValue(initialLayout.x);
                indicatorWidth.setValue(initialLayout.width);
                setIsReady(true);
            }
        }
    };

    return (
        <View style={[styles.container, style]}>
            {/* 슬라이딩 인디케이터 (배경) */}
            {isReady && (
                <Animated.View
                    style={[
                        styles.indicator,
                        {
                            transform: [{ translateX: indicatorPosition }],
                            width: indicatorWidth,
                        },
                    ]}
                />
            )}

            {/* 탭 아이템들 */}
            {items.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                    <Pressable
                        key={item.id}
                        style={styles.tabItem}
                        onLayout={(e) => handleTabLayout(item.id, e)}
                        onPress={() => onSelect(item.id)}
                    >
                        <Text
                            style={[
                                styles.tabLabel,
                                isSelected ? styles.tabLabelSelected : styles.tabLabelDefault,
                            ]}
                        >
                            {item.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
};

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: GAP,
        position: 'relative',
        alignSelf: 'stretch', // Figma: layoutSizingHorizontal FILL
    },
    indicator: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        backgroundColor: colors.background.warning.primary, // #FFB561
        borderRadius: CORNER_RADIUS,
    },
    tabItem: {
        paddingHorizontal: PADDING,
        paddingVertical: PADDING,
        borderRadius: CORNER_RADIUS,
    },
    tabLabel: {
        fontSize: 14,
        textAlign: 'center',
    },
    tabLabelDefault: {
        ...typography.label.mdSemiBold,
        color: colors.text.default.secondary, // #92846D
    },
    tabLabelSelected: {
        ...typography.label.mdBold,
        color: colors.text.default.primary, // #332C21
    },
});

export default TabMenu;
