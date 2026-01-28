/**
 * GenderScreen - 성별 선택 화면
 * 이름 추천 플로우의 두 번째 단계
 * Figma 스펙 기반 구현
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
    Topbar,
    TopbarItem,
    Pagination,
    SelectItem,
    Button,
    Icon,
    colors,
    space,
} from '../../design-system';

// 성별 옵션
type GenderOption = 'male' | 'female' | 'unknown';

const GENDER_OPTIONS: { id: GenderOption; label: string }[] = [
    { id: 'male', label: '남자' },
    { id: 'female', label: '여자' },
    { id: 'unknown', label: '아직 몰라요' },
];

export const GenderScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const [selectedGender, setSelectedGender] = useState<GenderOption | null>(null);

    const handleBack = () => {
        navigation.goBack();
    };

    const handleGenderSelect = (id: GenderOption) => {
        // 토글: 같은 항목 클릭시 선택 해제
        setSelectedGender(prev => prev === id ? null : id);
    };

    const handleNext = () => {
        // TODO: 다음 단계로 이동
        console.log('다음 pressed, selected gender:', selectedGender);
    };

    const isNextEnabled = selectedGender !== null;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Topbar - location: page */}
            <Topbar
                location="page"
                title="성별"
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
            />

            {/* Pagination - 7 pages, current: 2 (0-indexed: 1) */}
            <Pagination totalPages={6} currentPage={1} />

            {/* Content Section */}
            <View style={styles.contentSection}>
                {/* Page Header */}
                <View style={styles.pageHeader}>
                    <Text style={styles.title}>
                        타고난 성별을 알려주세요.
                    </Text>
                </View>

                {/* Gender Options - 세로 스택 */}
                <View style={styles.optionsContainer}>
                    {GENDER_OPTIONS.map((option) => (
                        <SelectItem
                            key={option.id}
                            status="medium"
                            label={option.label}
                            selected={selectedGender === option.id}
                            onPress={() => handleGenderSelect(option.id)}
                            style={styles.optionItem}
                        />
                    ))}
                </View>
            </View>

            {/* Bottom Button */}
            <View style={styles.bottomSection}>
                <Button
                    variant="primary"
                    size="large"
                    disabled={!isNextEnabled}
                    onPress={handleNext}
                    style={styles.nextButton}
                >
                    다음
                </Button>
            </View>

            {/* Safe Area Bottom Padding */}
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
        paddingHorizontal: space[500], // 20
        paddingTop: space[400], // 16
        paddingBottom: space[400], // 16
        gap: space[800], // 32
    },
    pageHeader: {
        gap: space[200], // 8
    },
    title: {
        fontFamily: 'Pretendard-Bold',
        fontSize: 23,
        fontWeight: '700',
        lineHeight: 28,
        color: colors.text.default.primary, // #332C21
    },
    optionsContainer: {
        flex: 1,
        gap: space[100], // 4
    },
    optionItem: {
        alignSelf: 'stretch', // 전체 너비
    },
    bottomSection: {
        paddingHorizontal: space[500], // 20
        paddingVertical: space[300], // 12
    },
    nextButton: {
        alignSelf: 'stretch', // 전체 너비
    },
});

export default GenderScreen;
