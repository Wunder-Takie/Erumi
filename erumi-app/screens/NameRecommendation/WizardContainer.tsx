/**
 * WizardContainer - 이름 추천 플로우 위자드 컨테이너
 * 
 * 공통 Topbar와 Pagination을 제공하고,
 * 버튼으로만 스텝 간 이동 (스와이프 없음)
 */
import React, { useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS, FadeIn, FadeOut, Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
    Topbar,
    TopbarItem,
    Pagination,
    Icon,
    colors,
} from '../../design-system';

// 스토리 스텝에서 사용하는 이미지들 - 미리 로드용
const STORY_IMAGES = [
    require('../../assets/images/story/story_1.png'),
    require('../../assets/images/story/spring_dream.png'),
    require('../../assets/images/story/summer_sea.png'),
    require('../../assets/images/story/autumn_forest.png'),
    require('../../assets/images/story/winter_snow.png'),
];

// 위자드 스텝 정의
export interface WizardStep {
    /** 스텝 고유 키 */
    key: string;
    /** Topbar 타이틀 */
    title: string;
    /** 스텝 컨텐츠 렌더 함수 */
    content: (props: WizardStepProps) => ReactNode;
    /** 헤더(탑바, 페이지네이션) 숨김 여부 (로딩 화면 등) */
    hideHeader?: boolean;
}

// 각 스텝에 전달되는 props
export interface WizardStepProps {
    /** 다음 스텝으로 이동 */
    goNext: () => void;
    /** 이전 스텝으로 이동 */
    goBack: () => void;
    /** 현재 스텝 인덱스 (0-indexed) */
    currentStep: number;
    /** 전체 스텝 수 */
    totalSteps: number;
    /** 위자드 전체에서 공유되는 데이터 */
    data: WizardData;
    /** 데이터 업데이트 함수 */
    updateData: (updates: Partial<WizardData>) => void;
    /** 성씨 검색 화면 열기 (SurnameStep용) */
    openSurnameSearch?: () => void;
}

// 위자드에서 수집하는 데이터
export interface WizardData {
    surname?: { id: string; hangul: string; hanja: string };
    gender?: 'male' | 'female' | 'unknown';
    birthDate?: Date;
    birthTime?: string; // 시진 ID (예: 'ja', 'chuk', 'in' 등)
    story?: string; // 스토리 ID
    vibe?: string; // 바이브 ID
    style?: string; // 스타일 ID
    // 추가 단계별 데이터...
}

// WizardContainer Props
interface WizardContainerProps {
    /** 위자드 스텝 목록 */
    steps: WizardStep[];
    /** Pagination에 표시할 총 페이지 수 */
    totalPages: number;
    /** Pagination 시작 페이지 (0-indexed) */
    startPage: number;
    /** 초기 데이터 */
    initialData?: Partial<WizardData>;
    /** 위자드 완료 콜백 */
    onComplete?: (data: WizardData) => void;
    /** 성씨 검색 화면 열기 콜백 */
    onOpenSurnameSearch?: () => void;
}

export const WizardContainer: React.FC<WizardContainerProps> = ({
    steps,
    totalPages,
    startPage,
    initialData = {},
    onComplete,
    onOpenSurnameSearch,
}) => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const [currentStep, setCurrentStep] = useState(0);
    const [displayedStep, setDisplayedStep] = useState(0); // 실제로 렌더링되는 스텝
    const [data, setData] = useState<WizardData>(initialData as WizardData);
    const isTransitioning = useRef(false);

    // 로딩 오버레이 상태 (StyleStep → LoadingStep → ResultStep 트랜지션용)
    const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);

    // 페이드 애니메이션 값
    const fadeAnim = useSharedValue(1);

    // 스토리 이미지 미리 로드 (컴포넌트 마운트 시)
    useEffect(() => {
        // 로컬 이미지를 미리 해석하여 캐싱
        STORY_IMAGES.forEach(imageSource => {
            Image.resolveAssetSource(imageSource);
        });
    }, []);

    // initialData가 변경되면 (검색에서 돌아왔을 때) data 업데이트
    React.useEffect(() => {
        if (initialData.surname) {
            setData(prev => ({ ...prev, surname: initialData.surname }));
        }
    }, [initialData.surname]);

    const handleBack = useCallback(() => {
        if (currentStep > 0) {
            // 이전 스텝으로
            setCurrentStep(currentStep - 1);
        } else {
            // 첫 스텝이면 네비게이션 뒤로가기
            navigation.goBack();
        }
    }, [currentStep, navigation]);

    const goNext = useCallback(() => {
        // 로딩 오버레이가 표시 중이면 FadeOut 처리
        if (showLoadingOverlay) {
            setShowLoadingOverlay(false);
            // currentStep은 이미 ResultStep을 가리키고 있음
            return;
        }

        if (currentStep < steps.length - 1) {
            const nextStepKey = steps[currentStep + 1]?.key;

            if (nextStepKey === 'loading') {
                // StyleStep → Loading: 오버레이 패턴
                // 1. LoadingStep 오버레이 FadeIn (먼저 덮음)
                setShowLoadingOverlay(true);
                // 2. 2초 후 베이스 레이어를 ResultStep으로 교체 (사용자에게 안 보임)
                setTimeout(() => {
                    setCurrentStep(currentStep + 2); // Result step
                    setDisplayedStep(currentStep + 2);
                }, 2000);
            } else {
                // 일반 스텝 전환
                setCurrentStep(currentStep + 1);
            }
        } else {
            // 마지막 스텝이면 완료 콜백
            onComplete?.(data);
        }
    }, [currentStep, steps.length, data, onComplete, steps, showLoadingOverlay]);

    // 트랜지션 완료 핸들러
    const finishTransition = useCallback(() => {
        isTransitioning.current = false;
    }, []);

    // 스텝 변경 시 애니메이션 (로딩 스텝만)
    useEffect(() => {
        if (currentStep !== displayedStep && !isTransitioning.current) {
            const wasHiddenHeader = steps[displayedStep]?.hideHeader || false;
            const willHideHeader = steps[currentStep]?.hideHeader || false;
            const isLoadingTransition = wasHiddenHeader || willHideHeader;

            if (isLoadingTransition) {
                // 로딩 스텝 진입/탈출: 페이드 애니메이션
                isTransitioning.current = true;
                fadeAnim.value = withTiming(0, { duration: 300 }, (finished) => {
                    if (finished) {
                        runOnJS(setDisplayedStep)(currentStep);
                        fadeAnim.value = withTiming(1, { duration: 400 }, (fadeInFinished) => {
                            if (fadeInFinished) {
                                runOnJS(finishTransition)();
                            }
                        });
                    }
                });
            } else {
                // 일반 스텝: 즉시 전환 (애니메이션 없음)
                setDisplayedStep(currentStep);
            }
        }
    }, [currentStep, displayedStep, fadeAnim, finishTransition, steps]);

    const goBack = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    }, [currentStep]);

    const updateData = useCallback((updates: Partial<WizardData>) => {
        setData(prev => ({ ...prev, ...updates }));
    }, []);

    const currentTitle = steps[displayedStep]?.title || '';
    const hideHeader = steps[displayedStep]?.hideHeader || false;

    // 애니메이션 스타일
    const animatedStyle = useAnimatedStyle(() => ({
        opacity: fadeAnim.value,
    }));

    return (
        <View style={[
            styles.container,
            { paddingTop: hideHeader ? 0 : insets.top },
            hideHeader && { backgroundColor: '#050510' }
        ]}>
            {/* Topbar - 타이틀만 변경 (hideHeader일 때 숨김) */}
            {!hideHeader && (
                <Topbar
                    location="page"
                    title={currentTitle}
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
                            onPress={handleBack}
                        />
                    }
                    trailingItems={
                        <TopbarItem
                            status="label"
                            label="홈으로"
                            onPress={() => {
                                // 홈으로 이동 (모든 데이터 초기화됨 - 화면 언마운트됨)
                                navigation.goBack();
                            }}
                        />
                    }
                />
            )}

            {/* Pagination (hideHeader일 때 숨김) */}
            {!hideHeader && (
                <Pagination
                    totalPages={totalPages}
                    currentPage={startPage + currentStep}
                    scrollPosition={startPage + currentStep}
                />
            )}

            {/* 베이스 스텝 컨텐츠 (페이드 애니메이션 적용) */}
            <Animated.View style={[styles.pager, animatedStyle]}>
                <View style={styles.stepContainer}>
                    {steps[displayedStep]?.content({
                        goNext,
                        goBack,
                        currentStep: displayedStep,
                        totalSteps: steps.length,
                        data,
                        updateData,
                        openSurnameSearch: onOpenSurnameSearch,
                    })}
                </View>
            </Animated.View>

            {/* LoadingStep 오버레이 (FadeIn/FadeOut 애니메이션) */}
            {showLoadingOverlay && (
                <Animated.View
                    style={styles.loadingOverlay}
                    entering={FadeIn.duration(300)}
                    exiting={FadeOut.duration(500).easing(Easing.in(Easing.cubic))}
                >
                    {steps.find(s => s.key === 'loading')?.content({
                        goNext,
                        goBack,
                        currentStep: steps.findIndex(s => s.key === 'loading'),
                        totalSteps: steps.length,
                        data,
                        updateData,
                        openSurnameSearch: onOpenSurnameSearch,
                    })}
                </Animated.View>
            )}

            {/* Hidden Image Preloader - 스토리 이미지 미리 로드 */}
            <View style={styles.hiddenPreloader}>
                {STORY_IMAGES.map((imageSource, index) => (
                    <Image key={index} source={imageSource} style={styles.preloadImage} />
                ))}
            </View>

            {/* Safe Area Bottom (hideHeader일 때는 숨김) */}
            {!hideHeader && <View style={{ height: insets.bottom > 0 ? insets.bottom : 34 }} />}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.default.highest,
    },
    pager: {
        flex: 1,
    },
    stepContainer: {
        flex: 1,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#050510',
    },
    hiddenPreloader: {
        position: 'absolute',
        width: 0,
        height: 0,
        opacity: 0,
        overflow: 'hidden',
    },
    preloadImage: {
        width: 1,
        height: 1,
    },
});

export default WizardContainer;
