/**
 * Erumi Design System - OrthodoxReport Component
 * 정통 작명 리포트 - TabMenu + OrthodoxReportContent 조합
 */
import * as React from 'react';
import { useState, useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle, ScrollView } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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
    /** 사주 정보 여부 (false면 자원오행 placeholder 표시) */
    hasSaju?: boolean;
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

const SWIPE_THRESHOLD = 15; // 스와이프 인식 최소 거리 (최대 민감)

// =============================================================================
// OrthodoxReport Component
// =============================================================================

export const OrthodoxReport: React.FC<OrthodoxReportProps> = ({
    pronunciationElements,
    fiveElementsTheory,
    suriAnalysis,
    elementalBalance,
    unluckyCharacters,
    hasSaju = true,
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
            scrollViewRef.current.scrollTo({ x: Math.max(0, layout.x - 16), animated: true });
        }
    }, [selectedTab]);

    // 탭 레이아웃 저장
    const handleTabLayout = (id: string, layout: { x: number; width: number }) => {
        tabLayouts.current[id] = layout;
    };

    // 탭 전환 함수
    const changeTab = React.useCallback((newTab: ContentType) => {
        setSelectedTab(newTab);
    }, []);

    // react-native-gesture-handler Pan 제스처
    const panGesture = Gesture.Pan()
        .activeOffsetX([-10, 10])   // 10px 수평 이동 시 제스처 활성화 (균형)
        .failOffsetY([-15, 15])     // 15px 수직 이동 시 제스처 실패 (스크롤 가능)
        .onEnd((event) => {
            const { translationX, velocityX } = event;
            // 속도가 조금이라도 있으면 threshold 더 낮춤
            const threshold = Math.abs(velocityX) > 100 ? 8 : SWIPE_THRESHOLD;

            if (translationX < -threshold && currentIndex < TAB_ITEMS.length - 1) {
                // 왼쪽으로 스와이프 → 다음 탭
                changeTab(TAB_ITEMS[currentIndex + 1].id as ContentType);
            } else if (translationX > threshold && currentIndex > 0) {
                // 오른쪽으로 스와이프 → 이전 탭
                changeTab(TAB_ITEMS[currentIndex - 1].id as ContentType);
            }
        })
        .runOnJS(true); // JS에서 실행

    // 현재 선택된 탭의 헤더 데이터
    const currentHeader = headerData?.[selectedTab];

    return (
        <View style={[styles.container, style]}>
            {/* Tab Menu */}
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabScroll}
                contentContainerStyle={styles.tabScrollContent}
            >
                <TabMenu
                    items={TAB_ITEMS}
                    selectedId={selectedTab}
                    onSelect={(id) => changeTab(id as ContentType)}
                    onTabLayout={handleTabLayout}
                />
            </ScrollView>

            {/* Header + Content 영역 전체에 GestureDetector 적용 */}
            <GestureDetector gesture={panGesture}>
                <View style={styles.gestureArea}>
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

                    {/* Content Area - 자원오행 탭에서 사주 정보 없으면 placeholder */}
                    {selectedTab === 'elementalBalance' && !hasSaju ? (
                        <View style={styles.placeholderContainer}>
                            <View style={styles.placeholderBox}>
                                <Text style={styles.placeholderText}>
                                    사주 정보를 입력하면{`\n`}자원오행 분석을 확인할 수 있어요.
                                </Text>
                            </View>
                            <View style={styles.placeholderButton}>
                                <Text style={styles.placeholderButtonText}>사주정보 입력하기</Text>
                            </View>
                        </View>
                    ) : (
                        <OrthodoxReportContent
                            style={styles.contentArea}
                            variant={selectedTab}
                            pronunciationElements={pronunciationElements}
                            fiveElementsTheory={fiveElementsTheory}
                            suriAnalysis={suriAnalysis}
                            elementalBalance={elementalBalance}
                            unluckyCharacters={unluckyCharacters}
                        />
                    )}
                </View>
            </GestureDetector>
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
    tabScroll: {
        marginHorizontal: -16, // Extend to screen edges for full-width scroll
    },
    tabScrollContent: {
        paddingHorizontal: 16, // Add padding to prevent clipping
        alignSelf: 'stretch', // FILL
    },
    // 제스처 인식 영역 (header + content)
    gestureArea: {
        flex: 1,
        gap: 16, // container와 동일한 gap
    },
    // Figma: header (VERTICAL, gap: 8, padding: 8, bg: surface.secondary, borderRadius: 16)
    headerContainer: {
        gap: 8, // Figma: gap 8
        padding: 8, // Figma: padding 8
        backgroundColor: colors.background.default.higher, // Figma: VariableID:5:270 (F4ECDD)
        borderRadius: 16, // Figma: cornerRadius 16
    },
    // Figma: reportOverview (padding 12, bg: surface.secondary.high, borderRadius: 12)
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
    // Placeholder styles (사주 정보 없을 때)
    placeholderContainer: {
        alignItems: 'center',
        gap: 16,
        paddingVertical: 40,
    },
    placeholderBox: {
        padding: 24,
        backgroundColor: colors.background.default.higher,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.primitives.sand[300],
        borderStyle: 'dashed',
    },
    placeholderText: {
        ...typography.label.md,
        color: colors.text.default.tertiary,
        textAlign: 'center',
    },
    placeholderButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: colors.background.accent.primary,
        borderRadius: 9999,
    },
    placeholderButtonText: {
        ...typography.label.md,
        fontWeight: '600',
        color: colors.background.accent.onPrimary,
    },
});

export default OrthodoxReport;
