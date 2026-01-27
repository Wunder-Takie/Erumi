/**
 * Erumi Design System - OrthodoxReport Component
 * 정통 작명 리포트 - TabMenu + OrthodoxReportContent 조합
 */
import * as React from 'react';
import { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, ScrollView, PanResponder } from 'react-native';
import { TabMenu, TabItem } from './TabMenu';
import {
    OrthodoxReportContent,
    ContentType,
    PronunciationElementsData,
    FiveElementsTheoryData,
    SuriAnalysisData,
    ElementalBalanceData,
    UnluckyCharactersData,
} from './OrthodoxReportContent';
import { space, typography, colors } from '../tokens';

// =============================================================================
// Types
// =============================================================================

export interface OrthodoxReportProps {
    /** 발음오행 데이터 */
    pronunciationElements: PronunciationElementsData;
    /** 자원오행 데이터 */
    fiveElementsTheory: FiveElementsTheoryData;
    /** 수리분석 데이터 */
    suriAnalysis: SuriAnalysisData;
    /** 음양배합 데이터 */
    elementalBalance: ElementalBalanceData;
    /** 불용문자 데이터 */
    unluckyCharacters: UnluckyCharactersData;
    /** 각 카테고리별 헤더 데이터 */
    headerData?: {
        [key in ContentType]?: {
            reportOverview?: string;
            categoryGuide?: string;
        };
    };
    /** 초기 선택 탭 */
    initialTab?: ContentType;
    /** Custom container style */
    style?: ViewStyle;
}

// =============================================================================
// Constants
// =============================================================================

const TAB_ITEMS: TabItem[] = [
    { id: 'fiveElementsTheory', label: '음양오행' },
    { id: 'pronunciationElements', label: '발음오행' },
    { id: 'suriAnalysis', label: '수리성명학' },
    { id: 'elementalBalance', label: '자원오행' },
    { id: 'unluckyCharacters', label: '불용문자' },
];

const SWIPE_THRESHOLD = 50; // 스와이프 인식 최소 거리

// =============================================================================
// OrthodoxReport Component
// =============================================================================

export const OrthodoxReport: React.FC<OrthodoxReportProps> = ({
    pronunciationElements,
    fiveElementsTheory,
    suriAnalysis,
    elementalBalance,
    unluckyCharacters,
    headerData,
    initialTab = 'fiveElementsTheory',
    style,
}) => {
    const [selectedTab, setSelectedTab] = useState<ContentType>(initialTab);
    const scrollViewRef = useRef<ScrollView>(null);
    const tabLayouts = useRef<{ [key: string]: { x: number; width: number } }>({});

    // 현재 탭 인덱스
    const currentIndex = TAB_ITEMS.findIndex((item) => item.id === selectedTab);

    // 선택된 탭이 변경될 때 자동 스크롤
    React.useEffect(() => {
        const layout = tabLayouts.current[selectedTab];
        if (layout && scrollViewRef.current) {
            // 탭이 보이도록 스크롤 (약간의 여유 공간 포함)
            scrollViewRef.current.scrollTo({ x: Math.max(0, layout.x - 16), animated: true });
        }
    }, [selectedTab]);

    // 탭 레이아웃 저장
    const handleTabLayout = (id: string, layout: { x: number; width: number }) => {
        tabLayouts.current[id] = layout;
    };

    // 스와이프 제스처 핸들러
    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => false,
                onMoveShouldSetPanResponder: (_, gestureState) => {
                    // 수평 드래그가 수직보다 클 때만 제스처 인식
                    return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
                },
                onPanResponderRelease: (_, gestureState) => {
                    const { dx } = gestureState;
                    if (dx < -SWIPE_THRESHOLD && currentIndex < TAB_ITEMS.length - 1) {
                        // 왼쪽으로 스와이프 → 다음 탭
                        setSelectedTab(TAB_ITEMS[currentIndex + 1].id as ContentType);
                    } else if (dx > SWIPE_THRESHOLD && currentIndex > 0) {
                        // 오른쪽으로 스와이프 → 이전 탭
                        setSelectedTab(TAB_ITEMS[currentIndex - 1].id as ContentType);
                    }
                },
            }),
        [currentIndex]
    );

    // 현재 선택된 탭의 헤더 데이터
    const currentHeader = headerData?.[selectedTab];

    return (
        <View style={[styles.container, style]}>
            {/* Tab Menu */}
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabScrollContent}
            >
                <TabMenu
                    items={TAB_ITEMS}
                    selectedId={selectedTab}
                    onSelect={(id) => setSelectedTab(id as ContentType)}
                    onTabLayout={handleTabLayout}
                />
            </ScrollView>

            {/* Header */}
            {(currentHeader?.reportOverview || currentHeader?.categoryGuide) && (
                <View style={styles.headerContainer}>
                    {currentHeader.reportOverview && (
                        <View style={styles.reportOverviewWrapper}>
                            <Text style={styles.reportOverviewText}>{currentHeader.reportOverview}</Text>
                        </View>
                    )}
                    {currentHeader.categoryGuide && (
                        <View style={styles.categoryGuideWrapper}>
                            <Text style={styles.categoryGuideText}>{currentHeader.categoryGuide}</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Content Area - 스와이프 제스처 적용 */}
            <View {...panResponder.panHandlers}>
                <OrthodoxReportContent
                    style={styles.contentArea}
                    variant={selectedTab}
                    pronunciationElements={pronunciationElements}
                    fiveElementsTheory={fiveElementsTheory}
                    suriAnalysis={suriAnalysis}
                    elementalBalance={elementalBalance}
                    unluckyCharacters={unluckyCharacters}
                />
            </View>
        </View>
    );
};

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 16, // Figma gap
    },
    // Figma: tapMenuWrapper (no padding)
    tabScrollContent: {
        // paddingHorizontal 없음 (Figma)
        alignSelf: 'stretch', // FILL
    },
    // Figma: header (VERTICAL, gap: 8, padding: 8, bg: surface.secondary, borderRadius: 16)
    headerContainer: {
        gap: 8, // Figma: gap 8
        padding: 8, // Figma: padding 8
        backgroundColor: colors.background.default.higher, // Figma: VariableID:5:270 (F4ECDD)
        borderRadius: 16, // Figma: cornerRadius 16
    },
    // Figma: reportOverview (padding: 12, bg: surface.tertiary, borderRadius: 12)
    reportOverviewWrapper: {
        padding: 12, // Figma: padding 12
        backgroundColor: colors.background.default.high, // Figma: VariableID:5:271 (E8DEC8)
        borderRadius: 12, // Figma: cornerRadius 12
    },
    reportOverviewText: {
        ...typography.label.md, // Figma: 14px/500 (Medium)
        color: colors.text.default.primary, // Figma: VariableID:5:279
    },
    // Figma: categoryGuide (paddingHorizontal: 8, paddingVertical: 4, no background)
    categoryGuideWrapper: {
        paddingHorizontal: 8, // Figma: padding 8
        paddingVertical: 4, // Figma: padding 4
    },
    categoryGuideText: {
        ...typography.label.xs, // Figma: 11px/500 (Medium)
        color: colors.text.default.tertiary, // Figma: VariableID:5:281
    },
    // Figma: OrthodoxReportContent (FILL horizontal, HUG vertical)
    contentArea: {
        alignSelf: 'stretch', // Figma: layoutSizingHorizontal FILL
    },
});

export default OrthodoxReport;
