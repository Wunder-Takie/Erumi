/**
 * StoryStep - 스토리 선택 스텝 (위자드용)
 * WizardContainer 내부에서 렌더링되는 스텝 컴포넌트
 * 가로 스크롤 카드로 스토리 선택
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import {
    Button,
    Icon,
    colors,
    space,
    radius,
} from '../../../design-system';
import { WizardStepProps } from '../WizardContainer';

// 고정 높이 요소들 (StoryStep이 WizardContainer 안에서 렌더링됨)
// pageHeader(약 74px) + contentSection padding(32px) + skipSection(32px) + bottomSection(76px) + gap(32px)
const FIXED_ELEMENTS_HEIGHT = 74 + 32 + 32 + 76 + 32; // 약 246px
const CARD_GAP = 8;

// 스토리 옵션 - Figma에서 추출한 일러스트 및 타이틀
const STORY_OPTIONS = [
    { id: 'spring_dream', title: '봄날 꿈속에서', image: require('../../../assets/images/story/story_1.png') },
    { id: 'summer_passion', title: '한여름 뜨거운 기다림 끝에', image: require('../../../assets/images/story/spring_dream.png') },
    { id: 'autumn_harvest', title: '풍요로운 가을의 선물', image: require('../../../assets/images/story/summer_sea.png') },
    { id: 'winter_star', title: '맑고 겨울밤 별을 보며', image: require('../../../assets/images/story/autumn_forest.png') },
    { id: 'night_dream', title: '조용한 밤 꿈결에', image: require('../../../assets/images/story/winter_snow.png') },
];

export const StoryStep: React.FC<WizardStepProps> = ({
    goNext,
    data,
    updateData,
}) => {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const CARD_WIDTH = screenWidth - 40; // 좌우 패딩 20씩 빼고
    const carouselHeight = screenHeight - FIXED_ELEMENTS_HEIGHT; // 캐러셀이 차지할 높이

    const scrollViewRef = React.useRef<ScrollView>(null);
    const [selectedStory, setSelectedStory] = useState<string | null>(data.story ?? null);

    // 초기 스크롤 위치 계산 (깜빡임 방지를 위해 렌더링 시 바로 적용)
    const initialScrollX = React.useMemo(() => {
        if (data.story) {
            const selectedIndex = STORY_OPTIONS.findIndex(story => story.id === data.story);
            if (selectedIndex > 0) {
                return selectedIndex * (CARD_WIDTH + CARD_GAP);
            }
        }
        return 0;
    }, [data.story, CARD_WIDTH]);

    const handleStorySelect = (id: string) => {
        const newValue = selectedStory === id ? null : id;
        setSelectedStory(newValue);
        if (newValue) {
            updateData({ story: newValue });
        }
    };

    const handleNext = () => {
        if (selectedStory) {
            updateData({ story: selectedStory });
            goNext();
        }
    };

    const handleSkip = () => {
        // 스토리 없이 다음으로
        goNext();
    };

    const isNextEnabled = selectedStory !== null;

    return (
        <View style={styles.container}>
            {/* Content Section - flex: 1로 남은 공간 차지 */}
            <View style={styles.contentSection}>
                {/* Page Header */}
                <View style={styles.pageHeader}>
                    <Text style={styles.title}>
                        이름을 짓기전 {'\n'}특별한 순간이 있었나요?
                    </Text>
                    <Text style={styles.subtitle}>
                        의미있던 장소나 태몽같은 특별한 순간을 떠올려보세요.
                    </Text>
                </View>

                {/* Story Cards Carousel */}
                <View style={styles.carouselContainer}>
                    <ScrollView
                        ref={scrollViewRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.carouselContent}
                        decelerationRate="fast"
                        snapToInterval={CARD_WIDTH + CARD_GAP}
                        snapToAlignment="start"
                        contentOffset={{ x: initialScrollX, y: 0 }}
                    >
                        {STORY_OPTIONS.map((story) => (
                            <Pressable
                                key={story.id}
                                style={[
                                    styles.storyCard,
                                    { width: CARD_WIDTH },
                                    selectedStory === story.id && styles.storyCardSelected,
                                ]}
                                onPress={() => handleStorySelect(story.id)}
                            >
                                <View style={styles.imageContainer}>
                                    <Image
                                        source={story.image}
                                        style={styles.storyImage}
                                        contentFit="cover"
                                        cachePolicy="memory-disk"
                                        transition={0}
                                    />
                                    {/* Selection Indicator */}
                                    <View style={[
                                        styles.selectionIndicator,
                                        selectedStory === story.id && styles.selectionIndicatorSelected,
                                    ]}>
                                        <Icon
                                            name="Check"
                                            size={20}
                                            color={selectedStory === story.id ? colors.icon.default.primary : colors.icon.default.tertiary}
                                        />
                                    </View>
                                </View>
                                <Text style={styles.storyTitle}>{story.title}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>
            </View>

            {/* Skip Button */}
            <View style={styles.skipSection}>
                <Pressable onPress={handleSkip} style={styles.skipButton}>
                    <Text style={styles.skipText}>
                        없어도 괜찮아요.(건너뛰기)
                    </Text>
                </Pressable>
            </View>

            {/* Bottom Button */}
            <View style={styles.bottomSection}>
                <Button
                    variant="primary"
                    size="large"
                    disabled={!isNextEnabled}
                    haptic
                    onPress={handleNext}
                    style={styles.nextButton}
                >
                    다음
                </Button>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // Figma: ContentSection - padding L=20 R=20 T=16 B=16, gap=32
    contentSection: {
        flex: 1,
        paddingHorizontal: space[500], // 20
        paddingTop: space[400], // 16
        paddingBottom: space[400], // 16
        gap: space[800], // 32
    },
    // Figma: questionWrapper - gap=8
    pageHeader: {
        gap: space[200], // 8
    },
    // Figma: 이름을 짓기전 특별한 순간이 있었나요? - Pretendard 23px weight=700 lineHeight=28 fill=#332c21
    title: {
        fontFamily: 'Pretendard-Bold',
        fontSize: 23,
        fontWeight: '700',
        lineHeight: 28,
        color: colors.text.default.primary, // #332c21
    },
    // Figma: 의미있던 장소나... - Pretendard 14px weight=500 lineHeight=18 fill=#92846d
    subtitle: {
        fontFamily: 'Pretendard-Medium',
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 18,
        color: colors.text.default.tertiary, // #92846d
    },
    // Figma: FiveElementsCarousel - flex: 1로 남은 공간 차지
    carouselContainer: {
        flex: 1,
        marginHorizontal: -space[500], // ContentSection padding 상쇄하여 전체 너비 사용
    },
    // Figma: carouselWrapper - gap=8, alignItems: center (Figma CSS 기준)
    carouselContent: {
        flexGrow: 1, // 전체 높이를 채우도록
        paddingHorizontal: space[500], // 20
        gap: CARD_GAP, // 8
        alignItems: 'center', // Figma CSS 기준
    },
    // Figma: ElementCard - 전체 높이 차지, gap=12
    storyCard: {
        height: '100%', // 부모 높이에 맞춤
        // width는 인라인으로 전달됨 (CARD_WIDTH)
        gap: space[300], // 12
        alignItems: 'center',
    },
    storyCardSelected: {
        // 선택 상태 - 카드 자체는 스타일 변경 없음
    },
    // Figma: imageWrapper - borderRadius=32 (radius[800])
    imageContainer: {
        flex: 1, // storyCard 안에서 남은 공간 차지
        width: '100%',
        borderRadius: radius[800], // 32
        overflow: 'hidden',
        position: 'relative',
    },
    storyImage: {
        flex: 1, // 컨테이너 채우기 (resizeMode="cover"와 함께 사용)
        width: '100%',
    },
    // Figma: IconButton (default) - fill=#ffffff, stroke=#ffffff weight=2, padding=4, radius=9999, size=32x32
    selectionIndicator: {
        position: 'absolute',
        right: space[300], // 12
        bottom: space[300], // 12
        width: 32,
        height: 32,
        borderRadius: radius.full, // 9999
        backgroundColor: colors.background.default.sky, // #ffffff
        borderWidth: 2,
        borderColor: 'white',
        padding: space[100], // 4 (Figma: padding=4)
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Figma: IconButton (selected) - fill=#FFB561, stroke=#ffffff weight=2.5
    selectionIndicatorSelected: {
        backgroundColor: colors.background.accent.secondary, // #FFB561 (orange[300])
        borderWidth: 2.5, // Figma: strokeWeight 증가
        borderColor: 'white',
    },
    storyTitle: {
        fontFamily: 'Pretendard-Bold',
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 23,
        color: colors.text.default.primary, // #332c21
        textAlign: 'center',
    },
    // Figma: skipButtonWrapper - padding L=16 R=16 T=4 B=4
    skipSection: {
        paddingHorizontal: space[400], // 16
        paddingVertical: space[100], // 4
        alignItems: 'center',
    },
    skipButton: {
        paddingHorizontal: space[400], // 16
        paddingVertical: space[300], // 12 (Figma: SkipButton padding)
    },
    skipText: {
        fontFamily: 'Pretendard-SemiBold',
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 16,
        color: colors.text.default.tertiary, // #92846d
    },
    // Figma: BottomBar - padding L=20 R=20 T=12 B=12, height=76
    bottomSection: {
        minHeight: 76, // Figma에서 BottomBar 높이
        paddingHorizontal: space[500], // 20
        paddingVertical: space[300], // 12
        justifyContent: 'center',
    },
    // Figma: Button - fill=#8ccae7 radius=9999, width=362 (전체 너비)
    nextButton: {
        alignSelf: 'stretch',
    },
    nextButtonDisabled: {
        backgroundColor: colors.background.disabled.accent, // #C9E8F7
    },
    nextButtonText: {
        fontFamily: 'Pretendard-Bold',
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 20,
        color: colors.background.accent.onPrimary, // #332C21
    },
    nextButtonTextDisabled: {
        color: colors.text.disabled.accent, // #8CCAE7
    },
});

export default StoryStep;
