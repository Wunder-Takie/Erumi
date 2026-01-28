/**
 * StyleStep - 스타일 선택 스텝 (위자드용)
 * WizardContainer 내부에서 렌더링되는 스텝 컴포넌트
 * hasBodyLabel SelectItem으로 스타일 옵션 선택
 * 
 * Figma Node: 327-2699
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
    Button,
    SelectItem,
    colors,
    space,
} from '../../../design-system';
import { WizardStepProps } from '../WizardContainer';

// 스타일 옵션 타입
interface StyleOption {
    id: string;
    title: string;
    body: string;
}

// 스타일 옵션 - Figma에서 추출한 데이터
const STYLE_OPTIONS: StyleOption[] = [
    {
        id: 'trendy',
        title: '세련되고 감각적인 이름 🌟️',
        body: '사주는 기본 조건만 맞추고, 불리기 예쁘고 트렌디한 느낌이 좋아요.',
    },
    {
        id: 'traditional',
        title: '사주 오행이 완벽한 이름 🔮',
        body: '트렌드보다는 정통 성명학에 맞춰, 부족한 기운을 확실히 채우는게 좋아요.',
    },
];

export const StyleStep: React.FC<WizardStepProps> = ({
    goNext,
    data,
    updateData,
}) => {
    const [selectedStyle, setSelectedStyle] = useState<string | null>(data.style ?? null);

    const handleStyleSelect = (id: string) => {
        const newValue = selectedStyle === id ? null : id;
        setSelectedStyle(newValue);
        if (newValue) {
            updateData({ style: newValue });
        }
    };

    const handleNext = () => {
        if (selectedStyle) {
            updateData({ style: selectedStyle });
            goNext();
        }
    };

    const isNextEnabled = selectedStyle !== null;

    return (
        <View style={styles.container}>
            {/* Content Section - Figma: paddingHorizontal: 20, paddingTop: 16, gap: 32 */}
            <View style={styles.contentSection}>
                {/* Page Header - Figma: gap=8 */}
                <View style={styles.pageHeader}>
                    <Text style={styles.title}>
                        이름을 짓기전{'\n'}특별한 순간이 있었나요?
                    </Text>
                    <Text style={styles.subtitle}>
                        의미있던 장소나 태몽같은 특별한 순간을 떠올려보세요.
                    </Text>
                </View>

                {/* Style Options - Figma: gap=4 */}
                <View style={styles.optionsContainer}>
                    {STYLE_OPTIONS.map((option) => (
                        <SelectItem
                            key={option.id}
                            status="hasBodyLabel"
                            label={option.title}
                            bodyLabel={option.body}
                            selected={selectedStyle === option.id}
                            onPress={() => handleStyleSelect(option.id)}
                        />
                    ))}
                </View>
            </View>

            {/* Bottom Button - Figma: paddingHorizontal: 20, paddingVertical: 12 */}
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
        color: colors.text.default.primary, // #332C21
    },
    subtitle: {
        fontFamily: 'Pretendard-Medium',
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 18,
        color: colors.text.default.tertiary, // #92846D
    },
    optionsContainer: {
        gap: space[100], // 4
    },
    bottomSection: {
        paddingHorizontal: space[500], // 20
        paddingVertical: space[300], // 12
    },
    nextButton: {
        alignSelf: 'stretch',
    },
});

export default StyleStep;
