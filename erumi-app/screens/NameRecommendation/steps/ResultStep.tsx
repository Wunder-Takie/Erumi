/**
 * ResultStep - 이름 생성 결과 스텝 (위자드용)
 * 로딩 후 이름 추천 결과를 보여주는 화면
 * 
 * Figma Node: 327-3017 (NameRecommendation/NameResult/OneTimeFree)
 */
import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, FlatList, ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import {
    Button,
    Badge,
    Topbar,
    TopbarItem,
    Logo,
    colors,
    space,
} from '../../../design-system';
import { WizardStepProps } from '../WizardContainer';

// Vector 배경 SVG Path (Figma 추출)
const BLOB_PATH = 'M151.968 7.38668C203.085 -12.109 249.039 9.92182 273.114 39.308C290.827 60.9297 301.507 91.604 296.271 122.713C306.473 122.243 316.942 124.107 326.772 128.601C357.892 142.829 370.819 178.017 355.644 207.195C321.838 272.195 248.379 302.429 188.249 305.058C157.352 306.408 122.391 300.994 93.0441 282.63C62.2944 263.388 42.0818 232.299 40.5639 193.955C14.2183 170.467 0 137.89 0 100.734C0.000206247 68.2719 28.0676 41.9561 62.691 41.9561C72.9956 41.9561 82.7191 44.2879 91.2952 48.4182C107.389 31.1552 127.239 17.1132 150.76 7.85518L151.968 7.38668Z';

// 더미 이름 데이터 (실제 구현 시 data에서 가져옴)
const DUMMY_NAMES = [
    {
        id: '1',
        nameKr: '김시아',
        nameHanja: '金詩雅',
        characters: [
            { meaning: '시', pronunciation: '시' },
            { meaning: '맑을/우아할', pronunciation: '아' },
        ],
        compatibility: '사주와 이름이 완벽하게 조화를 이뤄요!\n최고의 궁합이에요.',
    },
    {
        id: '2',
        nameKr: '김서윤',
        nameHanja: '金瑞潤',
        characters: [
            { meaning: '상서로울', pronunciation: '서' },
            { meaning: '윤택할', pronunciation: '윤' },
        ],
        compatibility: '균형 잡힌 이름으로\n조화로운 에너지를 가져요.',
    },
    {
        id: '3',
        nameKr: '김하늘',
        nameHanja: '金夏乙',
        characters: [
            { meaning: '여름', pronunciation: '하' },
            { meaning: '새', pronunciation: '늘' },
        ],
        compatibility: '밝고 활기찬 기운이\n가득한 이름이에요.',
    },
    {
        id: '4',
        nameKr: '김지우',
        nameHanja: '金智宇',
        characters: [
            { meaning: '지혜', pronunciation: '지' },
            { meaning: '집/하늘', pronunciation: '우' },
        ],
        compatibility: '지혜롭고 넓은 시야를\n가진 이름이에요.',
    },
    {
        id: '5',
        nameKr: '김수현',
        nameHanja: '金秀賢',
        characters: [
            { meaning: '빼어날', pronunciation: '수' },
            { meaning: '어질', pronunciation: '현' },
        ],
        compatibility: '뛰어난 재능과 덕망을\n지닌 이름이에요.',
    },
];

// 캐러셀 설정
const SIDE_PEEK = 24; // 양쪽에 보이는 다음/이전 카드 너비
const CARD_GAP = 12; // 카드 간 간격

export const ResultStep: React.FC<WizardStepProps> = ({
    goNext,
    goBack,
    data,
    updateData,
}) => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { width: screenWidth } = useWindowDimensions();
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    // 카드 너비 계산: 화면 너비 - 양쪽 peek - 양쪽 gap
    const CARD_WIDTH = screenWidth - (SIDE_PEEK * 2) - (CARD_GAP * 2);

    // Blob 배경 크기 (Figma 원본 크기: 화면 - 40px)
    const blobWidth = screenWidth - 40;
    const blobHeight = (blobWidth / 362) * 305;

    const handleViewNames = () => {
        goNext();
    };

    const handleViewAnalysis = () => {
        console.log('View analysis for:', DUMMY_NAMES[currentIndex].nameKr);
    };

    const handleGoHome = () => {
        // popToTop으로 "뒤로 가기" 애니메이션 사용
        (navigation as any).popToTop();
    };

    // 현재 보이는 카드 추적
    const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].index !== null) {
            setCurrentIndex(viewableItems[0].index);
        }
    }, []);

    const viewabilityConfig = {
        itemVisiblePercentThreshold: 50,
    };

    // 카드 아이템 렌더
    const renderCard = ({ item, index }: { item: typeof DUMMY_NAMES[0], index: number }) => (
        <View style={[styles.nameCard, { width: CARD_WIDTH, marginHorizontal: CARD_GAP }]}>
            {/* Vector 배경 (absolute positioned) */}
            <View style={[styles.blobBackground, { width: blobWidth, height: blobHeight }]}>
                <Svg width={blobWidth} height={blobHeight} viewBox="0 0 362 305">
                    <Path
                        d={BLOB_PATH}
                        fill={colors.background.default.higher}
                    />
                </Svg>
            </View>

            {/* Name content */}
            <View style={styles.nameContent}>
                {/* Name display with blur overlay for locked state */}
                <View style={styles.nameDisplayWrapper}>
                    {/* Actual text content */}
                    <View style={styles.nameDisplay}>
                        <Text style={styles.nameKr}>{item.nameKr}</Text>
                        <Text style={styles.nameHanja}>{item.nameHanja}</Text>
                    </View>

                    {/* Character meaning badges */}
                    <View style={styles.badgeRow}>
                        {item.characters.map((char, idx) => (
                            <Badge
                                key={idx}
                                firstLabel={char.meaning}
                                secondLabel={char.pronunciation}
                                size="medium"
                                shape="rectangle"
                                color="default"
                            />
                        ))}
                    </View>


                </View>

                {/* Compatibility message */}
                <Text style={styles.compatibilityText}>
                    {item.compatibility}
                </Text>
            </View>

            {/* View Analysis Button */}
            <View style={styles.buttonWrapper}>
                <Button
                    variant="outline"
                    size="small"
                    onPress={handleViewAnalysis}
                >
                    풀이보기
                </Button>
            </View>
        </View>
    );

    // FlatList getItemLayout for optimization
    const getItemLayout = (_: any, index: number) => ({
        length: CARD_WIDTH + CARD_GAP * 2,
        offset: (CARD_WIDTH + CARD_GAP * 2) * index,
        index,
    });

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Topbar - leadingItem off */}
            <Topbar
                location="page"
                title="이름 결과"
                trailingItems={
                    <TopbarItem
                        status="label"
                        label="홈으로"
                        onPress={handleGoHome}
                    />
                }
            />

            {/* Content Section */}
            <View style={styles.contentSection}>
                {/* Name Card Carousel */}
                <View style={styles.carouselContainer}>
                    <FlatList
                        ref={flatListRef}
                        data={DUMMY_NAMES}
                        renderItem={renderCard}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={CARD_WIDTH + CARD_GAP * 2}
                        snapToAlignment="start"
                        decelerationRate="fast"
                        contentContainerStyle={{
                            paddingHorizontal: SIDE_PEEK,
                        }}
                        getItemLayout={getItemLayout}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={viewabilityConfig}
                    />
                </View>

                {/* Page Header - Logo + Hero */}
                <View style={styles.pageHeader}>
                    <Logo size="small" />
                    <View style={styles.heroMsg}>
                        <Text style={styles.heroTitle}>내 이야기가 이름으로</Text>
                        <Text style={styles.heroSubtitle}>
                            성명학의 깊이는 그대로, 복잡한 풀이는 쉽게.{'\n'}
                            가장 잘 어울리는 세련된 이름을 추천받아보세요.
                        </Text>
                    </View>
                </View>
            </View>

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
                <Button
                    variant="primary"
                    size="large"
                    onPress={handleViewNames}
                >
                    이름 보기 (무료 1회)
                </Button>
            </View>

            {/* Safe Area Bottom */}
            <View style={{ height: insets.bottom > 0 ? insets.bottom : 34 }} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.default.highest,
    },
    contentSection: {
        flex: 1,
        paddingTop: space[400],
        paddingBottom: space[400],
        gap: space[600],
    },
    // Carousel container
    carouselContainer: {
        flex: 1,
    },
    // Name Card
    nameCard: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: space[400],
    },
    // Vector 배경 blob
    blobBackground: {
        position: 'absolute',
        alignSelf: 'center',
    },
    // Name content
    nameContent: {
        alignSelf: 'stretch',
        alignItems: 'center',
        gap: space[600],
    },
    nameDisplayWrapper: {
        alignItems: 'center',
        gap: space[300],
    },
    nameDisplay: {
        alignItems: 'center',
    },
    nameKr: {
        fontFamily: 'Pretendard-Bold',
        fontSize: 41,
        fontWeight: '700',
        lineHeight: 48,
        color: colors.text.default.primary,
        textAlign: 'center',
    },
    nameHanja: {
        fontFamily: 'Pretendard-Bold',
        fontSize: 36,
        fontWeight: '700',
        lineHeight: 42,
        color: colors.text.default.primary,
        textAlign: 'center',
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[100],
    },
    compatibilityText: {
        fontFamily: 'Pretendard-Medium',
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 18,
        color: colors.text.default.secondary,
        textAlign: 'center',
        alignSelf: 'stretch',
    },
    buttonWrapper: {
        alignItems: 'center',
    },
    // Page header
    pageHeader: {
        paddingHorizontal: space[500] + space[400],
        alignItems: 'center',
        gap: space[500],
    },
    heroMsg: {
        alignSelf: 'stretch',
        alignItems: 'center',
        gap: space[150],
    },
    heroTitle: {
        fontFamily: 'Pretendard-Bold',
        fontSize: 23,
        fontWeight: '700',
        lineHeight: 28,
        color: colors.text.default.primary,
        textAlign: 'center',
        alignSelf: 'stretch',
    },
    heroSubtitle: {
        fontFamily: 'Pretendard-Medium',
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 18,
        color: colors.text.default.tertiary,
        textAlign: 'center',
        alignSelf: 'stretch',
    },
    // Bottom Bar
    bottomBar: {
        paddingHorizontal: space[500],
        paddingVertical: space[300],
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ResultStep;
