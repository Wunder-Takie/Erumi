/**
 * ReportScreen - 이름 분석 리포트 화면
 * '풀이보기' 버튼 클릭 시 표시되는 상세 분석 화면
 * 
 * Figma Node: 431-6842 (NameRecommendation/NameResult/Unlocked/Report)
 */
import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    useWindowDimensions,
    FlatList,
    ViewToken,
    Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
    Topbar,
    TopbarItem,
    Icon,
    Pagination,
    OrthodoxReport,
    PronunciationElementsData,
    FiveElementsTheoryData,
    SuriAnalysisData,
    ElementalBalanceData,
    UnluckyCharactersData,
    ContentType,
    colors,
    space,
    radius,
} from '../../design-system';

// =============================================================================
// Types
// =============================================================================
interface NameCharacter {
    hanja: string;
    meaning: string;
    pronunciation: string;
}

interface MeaningCardItem {
    title: string;
    description: string;
}

interface MeaningCard {
    items: MeaningCardItem[]; // First card has 2 items, others have 1
}

interface NameVibeItem {
    title: string;
    description: string;
}

interface ReportData {
    nameKr: string;
    nameHanja: string;
    surname: {
        hanja: string;
        meaning: string;
        pronunciation: string;
        strokes: number;
        yinYang: '음' | '양';
    };
    characters: NameCharacter[];
    summary: string;
    meaningCards: MeaningCard[];
    orthodoxReport: {
        yinYang: string;
        pronunciation: string;
        numerology: string;
        element: string;
        unusedChars: string;
    };
    nameVibes: NameVibeItem[];
}

// =============================================================================
// Dummy Data
// =============================================================================
const DUMMY_REPORT: ReportData = {
    nameKr: '시랑',
    nameHanja: '詩朗',
    surname: {
        hanja: '金',
        meaning: '쇠',
        pronunciation: '김',
        strokes: 8,
        yinYang: '음',
    },
    characters: [
        { hanja: '詩', meaning: '시', pronunciation: '시' },
        { hanja: '朗', meaning: '밝을', pronunciation: '랑' },
    ],
    summary: '시처럼 아름다운 감수성과 명랑한 마음을 품고, 낭만적이고 환하게 빛나는 인생을 살아가길 바라는 이름이에요.',
    meaningCards: [
        {
            // First card: hanja字義 meanings (gap: 24)
            items: [
                {
                    title: '詩: 시, 문학, 풍부한 감성, 마음을 표현하다.',
                    description: '자신의 생각과 감정을 아름다운 언어로 표현하는 문학적 재능과 풍부한 감수성을 상징하며, 정서적으로 깊이 있는 내면을 의미해요.',
                },
                {
                    title: '朗: 밝다, 환하다, (소리가) 맑다, 명랑하다.',
                    description: '달빛처럼 환하고 목소리가 맑은 것을 뜻하며, 성격이 구김살 없이 쾌활하고 앞날이 훤히 트인다는 긍정적인 메시지를 담고 있어요.',
                },
            ],
        },
        {
            // Second card: combined meanings (gap: 8)
            items: [
                {
                    title: '맑은 목소리와 뛰어난 표현력',
                    description: '맑은 소리(朗)와 깊은 표현력(詩)을 겸비하여, 자신의 뜻을 세상에 명확하고 조리 있게 전달하는 리더나 예술가로 성장하라는 뜻이에요.',
                },
                {
                    title: '명랑하고 구김살 없는 예술가',
                    description: '섬세한 재능을 지녔으면서도 예민함 대신, 구김살 없이 밝고 명랑한 에너지로 주변에 즐거움을 주는 사람이 되라는 축복을 담고 있어요.',
                },
            ],
        },
    ],
    orthodoxReport: {
        yinYang: "'음' 기운이 강하지만 '양'의 기운도 적절히 조화되어 있어서 안정감을 주는 이름이에요. 내면의 평화를 유지하며 조화로운 삶을 살아갈 수 있음을 의미해요.",
        pronunciation: '발음오행 풀이 내용...',
        numerology: '수리성명학 풀이 내용...',
        element: '자원오행 풀이 내용...',
        unusedChars: '불용문자 풀이 내용...',
    },
    nameVibes: [
        {
            title: '낭만적이고 유니크함',
            description: '흔하지 않은 발음이라 기억에 오래 남으며, 마치 소설이나 웹툰 속 주인공처럼 낭만적이고 신비로운 분위기를 자아내요.',
        },
        {
            title: '청량하고 밝은 이미지',
            description: "'사랑'과 발음이 비슷해 사랑스러운 느낌을 주며, 맑고 깨끗한 소년/소녀의 이미지가 연상되는 청량한 이름이에요.",
        },
        {
            title: '영어 표기 추천',
            description: 'Si-rang, Shirang 등 외국인이 발음하기 좋으면서도 이름의 느낌을 살리는 표기법을 추천해 드릴 수 있어요.',
        },
    ],
};

// =============================================================================
// Orthodox Report Dummy Data
// =============================================================================
const DUMMY_ORTHODOX_DATA = {
    pronunciationElements: {
        surname: { hanja: '金', reading: '김', hun: '쇠' },
        firstName: { hanja: '詩', reading: '시', hun: '시' },
        secondName: { hanja: '朗', reading: '랑', hun: '밝을' },
    } as PronunciationElementsData,

    fiveElementsTheory: {
        surname: { hanja: '金', reading: '김', hun: '쇠', strokeCount: 8, isEven: true, yinYang: 'yin' as const },
        firstName: { hanja: '詩', reading: '시', hun: '시', strokeCount: 13, isEven: false, yinYang: 'yang' as const },
        secondName: { hanja: '朗', reading: '랑', hun: '밝을', strokeCount: 11, isEven: false, yinYang: 'yang' as const },
    } as FiveElementsTheoryData,

    suriAnalysis: {
        periods: [
            { label: '초년', detail: '0세~19세 | 24수', description: '부모의 그늘 없이도, 일찍부터 자신의 재능으로 두각을 나타내는 시기입니다.', badgeLabel: '대길', badgeColor: 'green' as const },
            { label: '청년', detail: '20세~39세 | 32수', description: '꾸준한 노력으로 사회적 기반을 다지고 성장하는 시기입니다.', badgeLabel: '길', badgeColor: 'green' as const },
            { label: '중년', detail: '40세~59세 | 37수', description: '그동안의 노력이 결실을 맺고 안정을 찾는 시기입니다.', badgeLabel: '길', badgeColor: 'green' as const },
            { label: '말년', detail: '60세~ | 45수', description: '평안하고 여유로운 노후를 보내며 후손의 복을 누리는 시기입니다.', badgeLabel: '대길', badgeColor: 'green' as const },
        ],
    } as SuriAnalysisData,

    elementalBalance: {
        elements: { wood: 2, fire: 1, earth: 3, metal: 2, water: 2 },
        nameElements: ['metal', 'fire', 'fire'] as ('wood' | 'fire' | 'earth' | 'metal' | 'water')[],
    } as ElementalBalanceData,

    unluckyCharacters: {
        firstName: { hanja: '詩', readingTitle: '시', reading: '시', badgeLabel: '양호', badgeColor: 'green' as const },
        secondName: { hanja: '朗', readingTitle: '랑', reading: '랑', badgeLabel: '양호', badgeColor: 'green' as const },
    } as UnluckyCharactersData,

    headerData: {
        fiveElementsTheory: {
            reportOverview: "'음' 기운이 강하지만 '양'의 기운도 적절히 조화되어 있어서 안정감을 주는 이름이에요. 내면의 평화를 유지하며 조화로운 삶을 살아갈 수 있음을 의미해요.",
            categoryGuide: '* 음양오행은 글자 획수의 짝수(음)와 홀수(양)를 적절히 섞어 기운의 균형을 맞추는 거에요.',
        },
        pronunciationElements: {
            reportOverview: '발음오행은 이름의 소리가 가진 오행 속성을 분석해요. 시(詩)는 수(水), 랑(朗)은 화(火)로 상생 관계를 이루어 조화로운 이름이에요.',
            categoryGuide: '* 발음오행은 이름을 불렀을 때 나는 소리의 기운을 분석하는 방법이에요.',
        },
        suriAnalysis: {
            reportOverview: '수리성명학으로 분석한 결과, 초년/중년/말년 운이 모두 길하여 전반적으로 좋은 운세를 가진 이름이에요.',
            categoryGuide: '* 수리성명학은 이름 획수의 합으로 인생의 시기별 운세를 풀이해요.',
        },
        elementalBalance: {
            reportOverview: '자원오행은 한자가 가진 본래의 오행 속성을 분석해요. 금(金), 화(火) 기운이 조화롭게 배치되어 있어요.',
            categoryGuide: '* 자원오행은 한자 자체가 가진 오행의 기운을 분석하는 방법이에요.',
        },
        unluckyCharacters: {
            reportOverview: '이름에 사용된 한자들은 모두 양호한 문자로, 불용문자에 해당하지 않아요. 안심하고 사용해도 좋은 이름이에요.',
            categoryGuide: '* 불용문자는 전통적으로 이름에 사용하기 꺼려지는 한자를 검토해요.',
        },
    } as { [key in ContentType]?: { reportOverview?: string; categoryGuide?: string } },
};

// =============================================================================
// Constants
// =============================================================================
const MEANING_CARD_WIDTH = 354;
const MEANING_CARD_GAP = 8;

// =============================================================================
// Component
// =============================================================================
export const ReportScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { width: screenWidth } = useWindowDimensions();

    const [meaningCardIndex, setMeaningCardIndex] = useState(0);

    const meaningCarouselRef = useRef<FlatList>(null);

    const report = DUMMY_REPORT;

    const handleGoBack = () => {
        navigation.goBack();
    };

    const handleShare = () => {
        console.log('Share report');
    };

    const handleGoHome = () => {
        (navigation as any).popToTop();
    };

    // Meaning card carousel viewability
    const onMeaningViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].index !== null) {
            setMeaningCardIndex(viewableItems[0].index);
        }
    }, []);

    const meaningViewabilityConfig = {
        itemVisiblePercentThreshold: 50,
    };

    // =============================================================================
    // Render Functions
    // =============================================================================

    // Letter Card (한자 + 훈/음)
    const renderLetterCard = (char: NameCharacter, size: 'large' | 'medium' = 'large') => (
        <View style={styles.letterCard} key={char.hanja}>
            <Text style={size === 'large' ? styles.hanjaLarge : styles.hanjaMedium}>
                {char.hanja}
            </Text>
            <View style={styles.textWrapper}>
                <Text style={styles.meaningText}>{char.meaning}</Text>
                <Text style={styles.pronunciationText}>{char.pronunciation}</Text>
            </View>
        </View>
    );

    // Meaning Card - first card has 2 meanings (gap:24), others have 1 (gap:8)
    const renderMeaningCard = ({ item, index }: { item: MeaningCard; index: number }) => (
        <View style={[styles.meaningCard, { width: MEANING_CARD_WIDTH }]}>
            <View style={[
                styles.meaningCardContent,
                item.items.length > 1 ? { gap: 24 } : { gap: 8 }
            ]}>
                {item.items.map((meaning, idx) => (
                    <View style={styles.meaningTextWrapper} key={idx}>
                        <Text style={styles.meaningCardTitle}>{meaning.title}</Text>
                        <Text style={styles.meaningCardDesc}>{meaning.description}</Text>
                    </View>
                ))}
            </View>
        </View>
    );

    // Name Vibe Item
    const renderNameVibeItem = (item: NameVibeItem, index: number) => (
        <View style={styles.nameVibeItem} key={index}>
            <Text style={styles.nameVibeTitle}>{item.title}</Text>
            <Text style={styles.nameVibeDesc}>{item.description}</Text>
        </View>
    );



    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Topbar */}
            <Topbar
                location="page"
                title="이름 풀이"
                leadingItems={
                    <TopbarItem
                        status="icon"
                        icon={
                            <Icon
                                name="arrowLeft"
                                size={24}
                                color={colors.icon.default.primary}
                            />
                        }
                        onPress={handleGoBack}
                    />
                }
                trailingItems={
                    <TopbarItem
                        status="label"
                        label="공유하기"
                        labelColor="#0052C7"
                        onPress={handleShare}
                    />
                }
            />

            {/* Scrollable Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 32 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* ================================================================= */}
                {/* Report Overview Section */}
                {/* ================================================================= */}
                <View style={styles.reportOverview}>
                    {/* Name Overview Card */}
                    <View style={styles.nameOverview}>
                        <View style={styles.marginWrapper}>
                            {/* Name with Hanja */}
                            <View style={styles.nameWrapper}>
                                {report.characters.map((char) => renderLetterCard(char, 'large'))}
                            </View>

                            {/* Summary Text */}
                            <Text style={styles.summaryText}>{report.summary}</Text>
                        </View>
                    </View>

                    {/* Meaning Card Carousel */}
                    <View style={styles.paginationWrapper}>
                        <FlatList
                            ref={meaningCarouselRef}
                            data={report.meaningCards}
                            renderItem={renderMeaningCard}
                            keyExtractor={(_, index) => index.toString()}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            snapToInterval={MEANING_CARD_WIDTH + MEANING_CARD_GAP}
                            decelerationRate="fast"
                            contentContainerStyle={styles.carouselContent}
                            ItemSeparatorComponent={() => <View style={{ width: MEANING_CARD_GAP }} />}
                            onViewableItemsChanged={onMeaningViewableItemsChanged}
                            viewabilityConfig={meaningViewabilityConfig}
                            style={styles.carouselFlatList}
                        />

                        {/* Pagination - using design system component */}
                        <Pagination
                            totalPages={report.meaningCards.length}
                            currentPage={meaningCardIndex}
                            style={styles.carouselPagination}
                        />
                    </View>
                </View>

                {/* ================================================================= */}
                {/* Report Details Section */}
                {/* ================================================================= */}
                <View style={styles.reportDetails}>
                    {/* Orthodox Report - using design system component */}
                    <View style={styles.orthodoxReportWrapper}>
                        <Text style={styles.sectionTitle}>성명학적 풀이</Text>
                        <OrthodoxReport
                            pronunciationElements={DUMMY_ORTHODOX_DATA.pronunciationElements}
                            fiveElementsTheory={DUMMY_ORTHODOX_DATA.fiveElementsTheory}
                            suriAnalysis={DUMMY_ORTHODOX_DATA.suriAnalysis}
                            elementalBalance={DUMMY_ORTHODOX_DATA.elementalBalance}
                            unluckyCharacters={DUMMY_ORTHODOX_DATA.unluckyCharacters}
                            headerData={DUMMY_ORTHODOX_DATA.headerData}
                        />
                    </View>

                    {/* Name Vibes */}
                    <View style={styles.nameVibesWrapper}>
                        <Text style={styles.sectionTitle}>이름의 느낌</Text>
                        <View style={styles.nameVibesList}>
                            {report.nameVibes.map((item, index) => renderNameVibeItem(item, index))}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

// =============================================================================
// Styles
// =============================================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.default.highest,
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: space[400],
        gap: 48, // space[1200]
    },

    // =========================================================================
    // Report Overview
    // =========================================================================
    reportOverview: {
        gap: 20, // Figma: gap:20
    },
    nameOverview: {
        // NO backgroundColor - Figma has no bg fill
        borderRadius: 0, // Figma: no border radius
    },
    marginWrapper: {
        paddingHorizontal: 16, // Figma: p:(24,16,24,16) = horizontal 16
        paddingVertical: 24, // Figma: vertical 24
        gap: 20, // Figma: gap:20
        alignItems: 'center',
    },
    nameWrapper: {
        flexDirection: 'row',
        gap: 24, // Figma: gap:24
    },
    letterCard: {
        alignItems: 'center',
        gap: 4, // Figma: gap:4
    },
    hanjaLarge: {
        fontFamily: 'Pretendard-Bold',
        fontSize: 41, // Figma: 41px
        fontWeight: '700',
        lineHeight: 48, // Figma: 48lh
        color: colors.text.default.primary, // Figma: rgb(51,44,33)
    },
    hanjaMedium: {
        fontFamily: 'Pretendard-Bold',
        fontSize: 26, // Figma: 26px
        fontWeight: '700',
        lineHeight: 32, // Figma: 32lh
        color: colors.text.default.primary, // Figma: rgb(51,44,33)
    },
    textWrapper: {
        flexDirection: 'row',
        gap: 4, // Figma: gap:4
    },
    meaningText: {
        fontFamily: 'Pretendard-SemiBold',
        fontSize: 14, // Figma: 14px
        fontWeight: '600',
        lineHeight: 16, // Figma: 16lh
        color: colors.text.default.secondary, // Figma: rgb(146,132,109)
    },
    pronunciationText: {
        fontFamily: 'Pretendard-Bold',
        fontSize: 14, // Figma: 14px
        fontWeight: '700',
        lineHeight: 18, // Figma: 18lh
        color: colors.text.default.primary, // Figma: rgb(51,44,33)
    },
    summaryText: {
        fontFamily: 'Pretendard-Medium',
        fontSize: 14, // Figma: 14px
        fontWeight: '500',
        lineHeight: 18, // Figma: 18lh
        color: colors.text.default.primary, // Figma: rgb(51,44,33) - NOT secondary!
        textAlign: 'center',
    },

    // =========================================================================
    // Meaning Card Carousel
    // =========================================================================
    paginationWrapper: {
        gap: 8, // Figma: gap between carousel and dots
    },
    carouselFlatList: {
        marginHorizontal: -16, // Extend to screen edges
        paddingHorizontal: 0,
    },
    carouselContent: {
        paddingHorizontal: 16, // Add padding to prevent card clipping
    },
    carouselPagination: {
        paddingHorizontal: 0,
        paddingBottom: 0,
    },
    meaningCard: {
        // NO backgroundColor - Figma has no bg fill
        borderRadius: 16, // Figma: r:16
        padding: 16, // Figma: p:16
        borderWidth: 1, // Figma: strokeWeight:1
        borderColor: '#D8CBB2', // Figma: stroke:rgb(216,203,178)
    },
    meaningCardContent: {
        gap: 24, // Figma: first 2 cards gap:24
    },
    meaningCardContentSmall: {
        gap: 8, // Figma: cards 3+ gap:8
    },
    meaningTextWrapper: {
        gap: 8, // Figma: gap:8 between title and desc
    },
    meaningCardTitle: {
        fontFamily: 'Pretendard-SemiBold',
        fontSize: 14, // Figma: 14px
        fontWeight: '600',
        lineHeight: 16, // Figma: 16lh
        color: colors.text.default.primary, // Figma: rgb(51,44,33)
    },
    meaningCardDesc: {
        fontFamily: 'Pretendard-Medium',
        fontSize: 14, // Figma: 14px
        fontWeight: '500',
        lineHeight: 18, // Figma: 18lh
        color: colors.text.default.secondary, // Figma: rgb(146,132,109)
    },
    paginationDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 4, // Figma: small gap between dots
    },
    paginationDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.primitives.sand[300],
    },
    paginationDotActive: {
        width: 16,
        backgroundColor: colors.primitives.sand[500],
    },

    // =========================================================================
    // Report Details
    // =========================================================================
    reportDetails: {
        gap: 48, // Figma: gap:48
    },
    sectionTitle: {
        fontFamily: 'Pretendard-Bold',
        fontSize: 14, // Figma: 14px
        fontWeight: '700',
        lineHeight: 18, // Figma: 18lh
        color: colors.text.default.primary, // Figma: rgb(51,44,33)
    },

    // =========================================================================
    // Orthodox Report
    // =========================================================================
    orthodoxReportWrapper: {
        gap: 12, // Figma: gap:12
    },
    tabMenuScroll: {
        marginHorizontal: -16, // Extend to edges
    },
    tabMenuContent: {
        paddingHorizontal: 16,
        gap: 8, // Figma: gap between tabs
    },
    tabItem: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: colors.primitives.sand[100],
        borderRadius: 8,
    },
    tabItemActive: {
        backgroundColor: colors.primitives.sand[800],
    },
    tabLabel: {
        fontFamily: 'Pretendard-SemiBold',
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 18,
        color: colors.text.default.secondary,
    },
    tabLabelActive: {
        color: colors.primitives.sand[50],
    },
    orthodoxContent: {
        gap: 16, // Figma: marginWrapper gap:16
    },
    orthodoxHeader: {
        backgroundColor: colors.primitives.sand[200], // Figma: bg:rgb(244,236,221)
        borderRadius: 16, // Figma: r:16
        padding: 8, // Figma: p:8
        gap: 8, // Figma: gap:8
    },
    orthodoxSummaryBox: {
        backgroundColor: colors.primitives.sand[300], // Figma: reportOverview bg:rgb(232,222,200)
        borderRadius: 12, // Figma: r:12
        padding: 12, // Figma: p:12
    },
    orthodoxHeaderText: {
        fontFamily: 'Pretendard-Medium',
        fontSize: 14, // Figma: 14px
        fontWeight: '500',
        lineHeight: 18, // Figma: 18lh
        color: colors.text.default.primary, // Figma: rgb(51,44,33)
    },
    orthodoxCharBreakdown: {
        gap: 0, // rows have no gap between them
    },
    orthodoxRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    orthodoxLetterCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    suriInfo: {
        alignItems: 'flex-end',
        gap: 4, // Figma: gap:4
    },
    suriText: {
        fontFamily: 'Pretendard-SemiBold',
        fontSize: 14, // Figma: 14px
        fontWeight: '600',
        lineHeight: 16, // Figma: 16lh
        color: colors.text.default.secondary, // Figma: rgb(146,132,109)
    },
    yinYangText: {
        fontFamily: 'Pretendard-SemiBold',
        fontSize: 14, // Figma: 14px
        fontWeight: '600',
        lineHeight: 18, // Figma: 18lh
        color: colors.text.default.primary, // Figma: rgb(51,44,33)
    },
    categoryGuide: {
        paddingHorizontal: 8, // Figma: p:(4,8,4,8)
        paddingVertical: 4,
    },
    categoryGuideText: {
        fontFamily: 'Pretendard-Medium',
        fontSize: 11,
        fontWeight: '500',
        color: colors.text.default.tertiary,
    },

    // =========================================================================
    // Name Vibes
    // =========================================================================
    nameVibesWrapper: {
        gap: 12, // Figma: gap:12
    },
    nameVibesList: {
        gap: 4, // Figma: gap:4
    },
    nameVibeItem: {
        backgroundColor: colors.primitives.sand[100], // Figma: bg:rgb(244,236,221) = #F4ECDD = sand[100]
        borderRadius: 16, // Figma: r:16
        padding: 12, // Figma: p:12
        gap: 8, // Figma: gap:8
    },
    nameVibeTitle: {
        fontFamily: 'Pretendard-SemiBold',
        fontSize: 14, // Figma: 14px
        fontWeight: '600',
        lineHeight: 16, // Figma: 16lh
        color: colors.text.default.primary, // Figma: rgb(51,44,33)
    },
    nameVibeDesc: {
        fontFamily: 'Pretendard-Medium',
        fontSize: 14, // Figma: 14px
        fontWeight: '500',
        lineHeight: 18, // Figma: 18lh
        color: colors.text.default.secondary, // Figma: rgb(146,132,109)
    },
});

export default ReportScreen;
