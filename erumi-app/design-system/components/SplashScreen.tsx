/**
 * SplashScreen Component
 * 앱 로딩 중 표시되는 스플래시 화면
 */
import * as React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../tokens';

const { width: screenWidth } = Dimensions.get('window');
// 원래 디자인 기준: 402px 화면에서 168px 로고 = 약 42%
const logoWidth = screenWidth * 0.42;
const logoHeight = logoWidth * (88 / 168); // 원래 비율 유지

export const SplashScreen: React.FC = () => {
    return (
        <View style={styles.container}>
            <Image
                source={require('../../assets/splash-icon.png')}
                style={{ width: logoWidth, height: logoHeight }}
                resizeMode="contain"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background.default.highest, // #FCF8F0
    },
});

export default SplashScreen;
