/**
 * Erumi Design System - OrthodoxReport Component
 * 정통 작명 리포트 - TabMenu + OrthodoxReportContent 조합
 */
import * as React from 'react';
import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
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
import { OrthodoxReportHeader } from './OrthodoxReportHeader';
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
    /** 사주 정보 여부 (false면 음양오행/자원오행에서 placeholder 표시) */
    hasSaju?: boolean;
    /** 사주정보 입력하기 버튼 클릭 핸들러 */
    onSajuInputPress?: () => void;
    /** 각 카테고리별 헤더 데이터 */
    headerData?: {
        [key in ContentType]?: {
            reportOverview?: string;
            categoryGuide?: string;
        };
    };
    /** 사주 분석 로딩 상태 */
    sajuLoading?: boolean;
    /** 사주 분석 에러 상태 */
    sajuError?: boolean;
    /** 사주 분석 재시도 핸들러 */
    onSajuRetry?: () => void;
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
    onSajuInputPress,
    headerData,
    sajuLoading = false,
    sajuError = false,
    onSajuRetry,
    initialTab = 'fiveElementsTheory',
    style,
}) => {
    const [selectedTab, setSelectedTab] = useState<ContentType>(initialTab);
    const scrollViewRef = useRef<ScrollView>(null);
    const tabLayouts = useRef<{ [key: string]: { x: number; width: number } }>({});
    const prevSajuLoadingRef = useRef(sajuLoading);

    // Android에서 LayoutAnimation 활성화
    useEffect(() => {
        if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        }
    }, []);

    // sajuLoading 변경 시 LayoutAnimation
    useLayoutEffect(() => {
        console.log('[OrthodoxReport] sajuLoading check:', prevSajuLoadingRef.current, '->', sajuLoading);
        if (prevSajuLoadingRef.current !== sajuLoading) {
            console.log('[OrthodoxReport] LayoutAnimation.configureNext called!');
            LayoutAnimation.configureNext({
                duration: 3000, // 3초 (임시)
                update: {
                    type: LayoutAnimation.Types.easeInEaseOut,
                    property: LayoutAnimation.Properties.scaleXY,
                },
                create: {
                    type: LayoutAnimation.Types.easeInEaseOut,
                    property: LayoutAnimation.Properties.opacity,
                },
                delete: {
                    type: LayoutAnimation.Types.easeInEaseOut,
                    property: LayoutAnimation.Properties.opacity,
                },
            });
            prevSajuLoadingRef.current = sajuLoading;
        }
    }, [sajuLoading]);

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
                    {/* OrthodoxReportHeader - 단일 컴포넌트 방식 (애니메이션 유지) */}
                    {(() => {
                        const isSajuTab = selectedTab === 'fiveElementsTheory' || selectedTab === 'elementalBalance';
                        const showHeader = isSajuTab || currentHeader?.reportOverview || currentHeader?.categoryGuide;

                        if (!showHeader) return null;

                        // variant 계산
                        const headerVariant = isSajuTab && sajuLoading ? 'loading'
                            : isSajuTab && sajuError ? 'error'
                                : isSajuTab && !hasSaju ? 'placeholder'
                                    : 'default';

                        return (
                            <OrthodoxReportHeader
                                variant={headerVariant}
                                title={headerVariant === 'default' ? currentHeader?.reportOverview : undefined}
                                guideLabel={currentHeader?.categoryGuide}
                                onPlaceholderButtonPress={headerVariant === 'error' ? onSajuRetry : onSajuInputPress}
                            />
                        );
                    })()}

                    {/* Content Area */}
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
    // Figma: OrthodoxReportContent (FILL horizontal, HUG vertical)
    contentArea: {
        alignSelf: 'stretch', // Figma: layoutSizingHorizontal FILL
    },
});

export default OrthodoxReport;
