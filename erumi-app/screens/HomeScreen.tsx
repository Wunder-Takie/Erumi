/**
 * HomeScreen - 홈 화면 (이름 추천)
 * Figma 스펙 기반 구현
 */
import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, Logo, colors, typography } from '../design-system';

const { width: screenWidth } = Dimensions.get('window');

export const HomeScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const lastTapRef = useRef<number>(0);
    const logoLastTapRef = useRef<number>(0);

    const handleStartRecommendation = () => {
        // Tab Navigator 안에 있으므로 parent Stack Navigator에 접근
        const parentNav = navigation.getParent();
        if (parentNav) {
            parentNav.navigate('NameWizard' as never);
        }
    };

    // 🆕 로고 더블탭 - AsyncStorage 초기화 (개발용)
    const handleLogoPress = async () => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300; // 300ms 이내 두 번 탭

        if (now - logoLastTapRef.current < DOUBLE_TAP_DELAY) {
            // 더블탭 감지됨 - AsyncStorage 초기화
            Alert.alert(
                '개발자 옵션',
                '모든 앱 데이터를 초기화하시겠습니까?',
                [
                    { text: '취소', style: 'cancel' },
                    {
                        text: '초기화',
                        style: 'destructive',
                        onPress: async () => {
                            await AsyncStorage.clear();
                            Alert.alert('완료', '앱 데이터가 초기화되었습니다. 앱을 다시 시작해주세요.');
                            console.log('[HomeScreen] AsyncStorage 초기화 완료');
                        },
                    },
                ]
            );
            logoLastTapRef.current = 0; // 리셋
        } else {
            logoLastTapRef.current = now;
        }
    };

    // 히어로 이미지 더블탭 감지 (숨겨진 데모 페이지 접근용)
    const handleHeroImagePress = () => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300; // 300ms 이내 두 번 탭

        if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
            // 더블탭 감지됨 - Demo 페이지로 이동
            const parentNav = navigation.getParent();
            if (parentNav) {
                parentNav.navigate('Demo' as never);
            }
            lastTapRef.current = 0; // 리셋
        } else {
            lastTapRef.current = now;
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Topbar - showLabel: false (텍스트 없음) */}
            <View style={styles.topbar}>
                <Pressable onPress={handleLogoPress}>
                    <Logo size="small" />
                </Pressable>
            </View>

            {/* ContentSection - 스크롤 없음 */}
            <View style={styles.contentSection}>
                {/* Hero Image - 더블탭으로 숨겨진 데모 페이지 접근 */}
                <Pressable style={styles.heroImg} onPress={handleHeroImagePress}>
                    <Image
                        source={require('../assets/hero-img.png')}
                        style={styles.heroImage}
                        resizeMode="cover"
                    />
                </Pressable>

                {/* Page Header */}
                <View style={styles.pageHeader}>
                    {/* Hero Message */}
                    <View style={styles.heroMsg}>
                        <Text style={styles.heroTitle}>내 이야기가 이름으로</Text>
                        <Text style={styles.heroSubtitle}>
                            성명학의 깊이는 그대로, 복잡한 풀이는 쉽게.{'\n'}
                            가장 잘 어울리는 세련된 이름을 추천받아보세요.
                        </Text>
                    </View>

                    {/* buttonWrapper: HORIZONTAL, primary:CENTER, sizing:FILL/HUG */}
                    <View style={styles.buttonWrapper}>
                        <Button
                            variant="primary"
                            size="large"
                            haptic
                            onPress={handleStartRecommendation}
                        >
                            이름 추천 받기
                        </Button>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.default.highest,
    },
    // Topbar: Figma - VERTICAL, p:16,12,16,12, gap:8, counterAxisAlignItems: CENTER
    topbar: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
        alignItems: 'center', // counterAxisAlignItems: CENTER
    },
    topbarSubtitle: {
        fontFamily: 'Pretendard-Bold',
        fontSize: 14,
        fontWeight: '700',
        lineHeight: 18,
        letterSpacing: 0,
        textAlign: 'center', // textAlignHorizontal: CENTER
        color: '#6d614c',
    },
    // ContentSection: justifyContent: center, alignItems: center, gap: 24
    contentSection: {
        flex: 1,
        gap: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // heroImg: alignSelf: stretch
    heroImg: {
        alignSelf: 'stretch', // Figma: alignSelf: 'stretch'
        height: 375,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    // pageHeader: alignSelf: stretch, paddingHorizontal: 16, alignItems: center, gap: 20
    pageHeader: {
        alignSelf: 'stretch', // Figma: alignSelf: 'stretch'
        paddingHorizontal: 16,
        gap: 20,
        alignItems: 'center', // Figma: alignItems: 'center'
    },
    // heroMsg: alignSelf: stretch, alignItems: center, gap: 6
    heroMsg: {
        alignSelf: 'stretch', // Figma: alignSelf: 'stretch'
        gap: 6,
        alignItems: 'center',
    },
    // 타이틀: alignSelf: stretch, textAlign: center
    heroTitle: {
        alignSelf: 'stretch',
        fontFamily: 'Pretendard-Bold',
        fontSize: 23,
        fontWeight: '700',
        lineHeight: 28,
        textAlign: 'center',
        color: '#332c21',
    },
    // 서브텍스트: alignSelf: stretch, textAlign: center
    heroSubtitle: {
        alignSelf: 'stretch',
        fontFamily: 'Pretendard-Medium',
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 18,
        textAlign: 'center',
        color: '#92846d',
    },
    // buttonWrapper: alignSelf: stretch, justifyContent: center
    buttonWrapper: {
        alignSelf: 'stretch', // Figma: alignSelf: 'stretch'
        flexDirection: 'row',
        justifyContent: 'center',
    },
});

export default HomeScreen;
