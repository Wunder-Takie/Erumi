/**
 * GenderStep - 성별 선택 스텝 (위자드용)
 * WizardContainer 내부에서 렌더링되는 스텝 컴포넌트
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
    SelectItem,
    Button,
    colors,
    space,
} from '../../../design-system';
import { WizardStepProps } from '../WizardContainer';

// 성별 옵션
type GenderOption = 'male' | 'female' | 'unknown';

const GENDER_OPTIONS: { id: GenderOption; label: string }[] = [
    { id: 'male', label: '남자' },
    { id: 'female', label: '여자' },
    { id: 'unknown', label: '아직 몰라요' },
];

export const GenderStep: React.FC<WizardStepProps> = ({
    goNext,
    data,
    updateData,
}) => {
    const [selectedGender, setSelectedGender] = useState<GenderOption | null>(
        data.gender || null
    );

    const handleGenderSelect = (id: GenderOption) => {
        // 토글: 같은 항목 클릭시 선택 해제
        const newValue = selectedGender === id ? null : id;
        setSelectedGender(newValue);
        if (newValue) {
            updateData({ gender: newValue });
        }
    };

    const handleNext = () => {
        if (selectedGender) {
            updateData({ gender: selectedGender });
            goNext();
        }
    };

    const isNextEnabled = selectedGender !== null;

    return (
        <View style={styles.container}>
            {/* Content Section */}
            <View style={styles.contentSection}>
                {/* Page Header */}
                <View style={styles.pageHeader}>
                    <Text style={styles.title}>
                        타고난{'\n'}성별을 알려주세요.
                    </Text>
                    <Text style={styles.subtitle}>
                        모른다면 성별 구분없이 사용될 수 있는 이름을 추천할게요.
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
        color: colors.text.default.primary,
    },
    subtitle: {
        fontFamily: 'Pretendard-Medium',
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 18,
        color: colors.text.default.tertiary,
    },
    optionsContainer: {
        flex: 1,
        gap: space[100], // 4
    },
    optionItem: {
        alignSelf: 'stretch',
    },
    bottomSection: {
        paddingHorizontal: space[500], // 20
        paddingVertical: space[300], // 12
    },
    nextButton: {
        alignSelf: 'stretch',
    },
});

export default GenderStep;
