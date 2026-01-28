/**
 * 플레이스홀더 화면들
 * 추후 각각 구현 예정
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography } from '../design-system';

interface PlaceholderScreenProps {
    title: string;
}

const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({ title }) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>준비 중입니다</Text>
        </View>
    );
};

export const NameBuilderScreen: React.FC = () => (
    <PlaceholderScreen title="셀프작명" />
);

export const NameChangeScreen: React.FC = () => (
    <PlaceholderScreen title="개명 가이드" />
);

export const ProfileScreen: React.FC = () => (
    <PlaceholderScreen title="프로필" />
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.default.highest,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        ...typography.heading.lg,
        color: colors.text.default.primary,
    },
    subtitle: {
        ...typography.label.md,
        color: colors.text.default.tertiary,
    },
});
