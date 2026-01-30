/**
 * VibeStep - 바이브 선택 스텝 (위자드용)
 * WizardContainer 내부에서 렌더링되는 스텝 컴포넌트
 * SelectItem hasImage status로 바이브 옵션 선택
 * 
 * Figma Node: 327:2509
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ImageSourcePropType } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Button,
    SelectItem,
    colors,
    space,
} from '../../../design-system';
import { WizardStepProps } from '../WizardContainer';

// 바이브 옵션 타입
interface VibeOption {
    id: string;
    title: string;
    subtitle: string;
    image: ImageSourcePropType;
}

// 바이브 옵션 - Figma에서 추출한 데이터
const VIBE_OPTIONS: VibeOption[] = [
    {
        id: 'forest_growth',
        title: '숲속 나무처럼 쑥쑥',
        subtitle: '건강하고 창의적인 성장',
        image: require('../../../assets/images/vibe/forest_growth.png'),
    },
    {
        id: 'sunshine_warmth',
        title: '햇살처럼 따뜻하게',
        subtitle: '사람들에게 사랑받는 리더',
        image: require('../../../assets/images/vibe/sunshine_warmth.png'),
    },
    {
        id: 'mountain_steady',
        title: '산처럼 듬직하게',
        subtitle: '든든하고 믿음직하게',
        image: require('../../../assets/images/vibe/mountain_steady.png'),
    },
    {
        id: 'star_shine',
        title: '별처럼 빛나게',
        subtitle: '어디서든 돋보이는 존재',
        image: require('../../../assets/images/vibe/star_shine.png'),
    },
    {
        id: 'wave_flow',
        title: '물결처럼 유연하게',
        subtitle: '어떤 상황에도 자연스럽게',
        image: require('../../../assets/images/vibe/wave_flow.png'),
    },
];

export const VibeStep: React.FC<WizardStepProps> = ({
    goNext,
    data,
    updateData,
}) => {
    const [selectedVibe, setSelectedVibe] = useState<string | null>(data.vibe ?? null);

    const handleVibeSelect = (id: string) => {
        const newValue = selectedVibe === id ? null : id;
        setSelectedVibe(newValue);
        if (newValue) {
            updateData({ vibe: newValue });
        }
    };

    const handleNext = () => {
        if (selectedVibe) {
            updateData({ vibe: selectedVibe });
            goNext();
        }
    };

    const handleSkip = () => {
        // 바이브 없이 다음으로
        goNext();
    };

    const isNextEnabled = selectedVibe !== null;

    return (
        <View style={styles.container}>
            {/* Content Section */}
            <View style={styles.contentSection}>
                {/* Page Header - Figma: questionWrapper gap=8 */}
                <View style={styles.pageHeader}>
                    <Text style={styles.title}>
                        이름을 받는이가{'\n'}어떤 사람으로 자라길 바라나요?
                    </Text>
                    <Text style={styles.subtitle}>
                        이름에 따뜻한 마음을 담아주세요 :)
                    </Text>
                </View>

                {/* Vibe List with bottom fade effect - Figma: gap=4 */}
                <View style={styles.listWrapper}>
                    <MaskedView
                        style={styles.maskedContainer}
                        maskElement={
                            <LinearGradient
                                colors={['black', 'black', 'black', 'transparent']}
                                locations={[0, 0.75, 0.85, 1]}
                                style={styles.maskGradient}
                            />
                        }
                    >
                        <ScrollView
                            style={styles.listContainer}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.listContent}
                        >
                            {VIBE_OPTIONS.map((vibe) => (
                                <SelectItem
                                    key={vibe.id}
                                    status="hasImage"
                                    label={vibe.title}
                                    bodyLabel={vibe.subtitle}
                                    imageSource={vibe.image}
                                    selected={selectedVibe === vibe.id}
                                    onPress={() => handleVibeSelect(vibe.id)}
                                />
                            ))}
                        </ScrollView>
                    </MaskedView>
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
    // Figma: Title - Pretendard 23px weight=700 lineHeight=28 fill=#332c21
    title: {
        fontFamily: 'Pretendard-Bold',
        fontSize: 23,
        fontWeight: '700',
        lineHeight: 28,
        color: colors.text.default.primary, // #332c21
    },
    // Figma: Subtitle - Pretendard 14px weight=500 lineHeight=18 fill=#92846d
    subtitle: {
        fontFamily: 'Pretendard-Medium',
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 18,
        color: colors.text.default.tertiary, // #92846d
    },
    listWrapper: {
        flex: 1,
        overflow: 'hidden',
    },
    maskedContainer: {
        flex: 1,
    },
    maskGradient: {
        flex: 1,
    },
    listContainer: {
        flex: 1,
    },
    // Figma: List - gap=4
    listContent: {
        gap: space[100], // 4
        paddingBottom: space[600], // 24 - 그라데이션 영역을 위한 여백
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
    // Figma: BottomBar - padding L=20 R=20 T=12 B=12
    bottomSection: {
        paddingHorizontal: space[500], // 20
        paddingVertical: space[300], // 12
    },
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

export default VibeStep;
