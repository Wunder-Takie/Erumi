/**
 * ResultStep - 이름 생성 결과 스텝 (위자드용)
 * 로딩 후 이름 추천 결과를 보여주는 화면
 * 
 * Figma Node: 327-3017 (NameRecommendation/NameResult/OneTimeFree)
 */
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, FlatList, ViewToken, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    withDelay,
    withSpring,
    FadeIn,
    FadeOut,
    SlideInUp,
    SlideInDown,
    SlideOutUp,
    LinearTransition,
    Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
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
import { useNameGeneration } from '../hooks/useNameGeneration';
import { BatchNameCandidate } from 'erumi-core';

// Vector 배경 SVG Path (Figma 추출)
const BLOB_PATH = 'M151.968 7.38668C203.085 -12.109 249.039 9.92182 273.114 39.308C290.827 60.9297 301.507 91.604 296.271 122.713C306.473 122.243 316.942 124.107 326.772 128.601C357.892 142.829 370.819 178.017 355.644 207.195C321.838 272.195 248.379 302.429 188.249 305.058C157.352 306.408 122.391 300.994 93.0441 282.63C62.2944 263.388 42.0818 232.299 40.5639 193.955C14.2183 170.467 0 137.89 0 100.734C0.000206247 68.2719 28.0676 41.9561 62.691 41.9561C72.9956 41.9561 82.7191 44.2879 91.2952 48.4182C107.389 31.1552 127.239 17.1132 150.76 7.85518L151.968 7.38668Z';

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

    // 엔진에서 생성된 이름 데이터 (전역 상태 공유)
    const { names, loadMore, isLoadingMore, hasMore, isExhausted, isUnlocked, unlock, sajuInfo } = useNameGeneration();

    // isLocked는 isUnlocked의 반대
    const isLocked = !isUnlocked;

    // 첫 잠금 해제 시에만 애니메이션 실행 (이후 배치 로드에서는 애니메이션 없음)
    const hasAnimatedRef = useRef(false);
    if (isUnlocked && !hasAnimatedRef.current) {
        hasAnimatedRef.current = true;
    }
    const shouldAnimateReveal = isUnlocked && hasAnimatedRef.current && names?.length === 1;

    // 이름 데이터를 UI 형식으로 변환
    const displayNames = useMemo(() => {
        if (!names || names.length === 0) {
            return [];
        }
        return names.map((name, idx) => {
            // hun 필드에서 직접 훈 조회
            const meaning1 = name.hanja1?.hun || '';  // 훈
            const pronunciation1 = name.hangulName.charAt(0) || '';  // 음 (한글에서)
            const meaning2 = name.hanja2?.hun || '';  // 훈
            const pronunciation2 = name.hangulName.charAt(1) || '';  // 음 (한글에서)

            return {
                id: String(idx),
                nameKr: `${data.surname?.hangul || ''}${name.hangulName}`,
                nameHanja: `${data.surname?.hanja || ''}${name.hanjaName}`,
                characters: [
                    { meaning: meaning1, pronunciation: pronunciation1 },
                    { meaning: meaning2, pronunciation: pronunciation2 },
                ],
                compatibility: '사주와 이름이 조화를 이뤄요!',
            };
        });
    }, [names, data.surname]);

    // 종 흔들림 애니메이션 (3초마다 loop)
    const shakeRotation = useSharedValue(0);

    useEffect(() => {
        if (isLocked) {
            // 3초마다 종처럼 흔들리는 애니메이션
            const shakeAnimation = () => {
                shakeRotation.value = withSequence(
                    withTiming(15, { duration: 80 }),
                    withTiming(-15, { duration: 80 }),
                    withTiming(12, { duration: 80 }),
                    withTiming(-12, { duration: 80 }),
                    withTiming(8, { duration: 80 }),
                    withTiming(-8, { duration: 80 }),
                    withTiming(0, { duration: 80 })
                );
            };

            // 초기 1회 실행
            shakeAnimation();

            // 3초마다 반복
            const intervalId = setInterval(shakeAnimation, 3000);

            return () => clearInterval(intervalId);
        }
    }, [isLocked, shakeRotation]);

    const shakeStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${shakeRotation.value}deg` }],
    }));

    // 카드 너비 계산: 화면 너비 - 양쪽 peek - 양쪽 gap
    const CARD_WIDTH = screenWidth - (SIDE_PEEK * 2) - (CARD_GAP * 2);

    // Blob 배경 크기 (Figma 원본 크기: 화면 - 40px)
    const blobWidth = screenWidth - 40;
    const blobHeight = (blobWidth / 362) * 305;

    // 이름 보기 버튼 클릭 시 잠금 해제
    const handleViewNames = () => {
        unlock();  // 전역 상태 변경
    };

    // 버튼 width 애니메이션 스타일
    const buttonAnimatedStyle = useAnimatedStyle(() => ({
        width: withTiming(isLocked ? 'auto' : '100%', { duration: 350, easing: Easing.out(Easing.cubic) }),
    }), [isLocked]);

    const handleViewAnalysis = () => {
        // 잠금 상태일 때는 결제 다이얼로그 표시 (추후 구현)
        if (isLocked) {
            console.log('Show payment dialog');
            return;
        }
        // 잠금 해제 시 리포트 화면으로 이동
        const currentName = names[currentIndex];
        console.log('[ResultStep] currentName:', currentName);
        console.log('[ResultStep] names length:', names?.length, 'currentIndex:', currentIndex);

        const nameData = {
            hangulName: currentName?.hangulName,
            hanjaName: currentName?.hanjaName,
            surname: data.surname?.hangul || '',
            surnameHanja: data.surname?.hanja || '',
            hanja1: currentName?.hanja1,
            hanja2: currentName?.hanja2,
        };
        console.log('[ResultStep] navigating with nameData:', nameData);

        // 전역 사주 정보 우선, 없으면 wizardData 사용
        const effectiveBirthDate = sajuInfo?.birthDate || data.birthDate;
        const effectiveBirthTime = sajuInfo?.birthTime || data.birthTime;

        (navigation as any).navigate('NameReport', {
            nameData,
            saju: {
                birthDate: effectiveBirthDate?.toISOString().split('T')[0],
                birthTime: effectiveBirthTime,
            },
        });
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
    interface DisplayNameItem {
        id: string;
        nameKr: string;
        nameHanja: string;
        characters: { meaning: string; pronunciation: string }[];
        compatibility: string;
    }

    const renderCard = ({ item, index }: { item: DisplayNameItem, index: number }) => (
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
                {/* Name display wrapper - lockIcon 또는 실제 콘텐츠 표시 */}
                <View style={styles.nameDisplayWrapper}>
                    {/* Lock 해제 시 보이는 콘텐츠 (첫 해제 시에만 FadeIn 애니메이션) */}
                    {!isLocked && (
                        <Animated.View
                            entering={shouldAnimateReveal ? FadeIn.duration(500).delay(300) : undefined}
                            style={styles.unlockedContent}
                        >
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
                        </Animated.View>
                    )}

                    {/* Lock Icon 오버레이 (잠금 상태일 때만 표시) */}
                    {isLocked && (
                        <Animated.View
                            style={styles.lockIconContainer}
                            exiting={FadeOut.duration(500)}
                        >
                            <Animated.View style={[styles.lockIconInner, shakeStyle]}>
                                {/* Figma에서 추출한 Lock Icon SVG (filled style) */}
                                <Svg width={80} height={80} viewBox="0 0 80 80" fill="none">
                                    {/* 열쇠구멍 */}
                                    <Path
                                        d="M40 42.667C42.2091 42.667 44 44.4579 44 46.667C43.9999 48.1471 43.1951 49.4382 42 50.1299V53.667C41.9998 54.7714 41.1045 55.667 40 55.667C38.8955 55.667 38.0002 54.7714 38 53.667V50.1299C36.8049 49.4382 36.0001 48.1471 36 46.667C36 44.4579 37.7909 42.667 40 42.667Z"
                                        fill={colors.primitives.sand[500]}
                                    />
                                    {/* 자물쇠 본체 */}
                                    <Path
                                        d="M40 10.5C47.6112 10.5 53.8035 16.5737 53.9951 24.1387L54 24.5V31.667C59.6753 32.6192 64 37.5541 64 43.5V57.5C64 64.1274 58.6274 69.5 52 69.5H28C21.3726 69.5 16 64.1274 16 57.5V43.5C16 37.5541 20.3247 32.6192 26 31.667V24.5L26.0049 24.1387C26.1935 16.6938 32.1938 10.6935 39.6387 10.5049L40 10.5ZM28 35.5C23.5817 35.5 20 39.0817 20 43.5V57.5C20 61.9183 23.5817 65.5 28 65.5H52C56.4183 65.5 60 61.9183 60 57.5V43.5C60 39.0817 56.4183 35.5 52 35.5H28ZM30 31.5H50V24.5C50 18.9772 45.5228 14.5 40 14.5C34.4772 14.5 30 18.9772 30 24.5V31.5Z"
                                        fill={colors.primitives.sand[500]}
                                    />
                                </Svg>
                            </Animated.View>
                        </Animated.View>
                    )}
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
                    haptic
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
                        data={displayNames}
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
                <Pressable
                    style={[
                        styles.bottomButton,
                        { flex: 1 },
                        !isLocked && isExhausted && styles.disabledButton,
                    ]}
                    onPress={isLocked ? () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleViewNames();
                    } : () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        // 로딩 화면을 다시 보여주고 추가 이름 로드
                        updateData({ loadMoreFlag: true });
                        goBack();
                    }}
                    disabled={!isLocked && (isLoadingMore || isExhausted)}
                >
                    <View style={styles.buttonTextClip}>
                        {isLocked ? (
                            <Animated.Text
                                key="locked"
                                exiting={shouldAnimateReveal ? SlideOutUp.duration(350).easing(Easing.in(Easing.cubic)) : undefined}
                                style={styles.bottomButtonText}
                            >
                                이름 보기 (무료 1회)
                            </Animated.Text>
                        ) : (
                            <Animated.Text
                                key="unlocked"
                                entering={shouldAnimateReveal && !isExhausted ? SlideInDown.duration(300).easing(Easing.out(Easing.cubic)) : undefined}
                                style={[
                                    styles.bottomButtonText,
                                    isExhausted && styles.disabledButtonText,
                                ]}
                            >
                                {isLoadingMore
                                    ? '로딩 중...'
                                    : isExhausted
                                        ? '더 이상 추천할 이름이 없어요'
                                        : '이름 더 받아보기'}
                            </Animated.Text>
                        )}
                    </View>
                </Pressable>
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
        justifyContent: 'center',
        minHeight: 140, // unlocked 콘텐츠 높이에 맞춤 (레이아웃 점프 방지)
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
    // Lock Icon Container
    lockIconContainer: {
        width: 112,
        height: 112,
        borderRadius: 9999,
        backgroundColor: colors.primitives.sand[200],
        justifyContent: 'center',
        alignItems: 'center',
    },
    lockIconInner: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Unlocked content
    unlockedContent: {
        alignItems: 'center',
        gap: space[300],
    },
    // Animated wrapper for button width animation
    buttonAnimatedWrapper: {
        alignSelf: 'center',
    },
    // Card internal button wrapper
    buttonWrapper: {
        alignItems: 'center',
    },
    // Base button style - primary button style from design system
    bottomButton: {
        height: 52,
        borderRadius: 9999, // Figma: pill shape
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: colors.background.accent.primary,
    },
    // Text clip container for slide animation
    buttonTextClip: {
        overflow: 'hidden',
        height: 20, // same as line height
        alignSelf: 'stretch', // stretch to button width
        alignItems: 'center',
    },
    // Button text style
    bottomButtonText: {
        fontFamily: 'Pretendard-Bold',
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 20,
        color: colors.background.accent.onPrimary,
        textAlign: 'center',
    },
    // Locked state button - uses accent primary color
    lockedButton: {
        backgroundColor: colors.background.accent.primary,
    },
    lockedButtonText: {
        fontFamily: 'Pretendard-Bold',
        fontSize: 16,
        fontWeight: '700',
        color: colors.background.accent.onPrimary,
    },
    // Unlocked state button - Figma: bg #8CCAE7, text #332C21, font 700/16, radius 9999
    unlockedButton: {
        backgroundColor: '#8CCAE7', // Figma: rgba(140, 202, 231)
    },
    unlockedButtonText: {
        fontFamily: 'Pretendard-Bold',
        fontSize: 16,
        fontWeight: '700',
        color: '#332C21', // Figma: rgba(51, 44, 33)
    },
    // Disabled button style (when exhausted) - matches Button component disabled primary
    disabledButton: {
        backgroundColor: colors.background.disabled.accent,
    },
    disabledButtonText: {
        color: colors.text.disabled.accent,
    },
});

export default ResultStep;
