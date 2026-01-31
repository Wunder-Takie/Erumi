/**
 * Erumi Design System - OrthodoxReportContent Component
 * 정통 작명 리포트 콘텐츠 - 탭별 variant
 */
import * as React from 'react';
import { View, Text, StyleSheet, ViewStyle, Image, ImageSourcePropType } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { YinYang, YinYangVariant } from './YinYang';
import { ElementBarGraph, ElementValues, ElementType } from './ElementBarGraph';
import { Badge } from './Badge';
import { colors, typography, space, radius } from '../tokens';

// =============================================================================
// Types
// =============================================================================

export type ContentType =
    | 'pronunciationElements'
    | 'fiveElementsTheory'
    | 'suriAnalysis'
    | 'elementalBalance'
    | 'unluckyCharacters';

// Data types for each content variant
export interface CharacterInfo {
    hanja: string;
    reading: string;
    imageSource?: ImageSourcePropType;
}

export interface PronunciationElementsData {
    surname: CharacterInfo & { hun: string };
    firstName: CharacterInfo & { hun: string };
    secondName?: CharacterInfo & { hun: string };
}

export interface FiveElementsTheoryData {
    surname: CharacterInfo & {
        hun: string; // 쇠, 나무 등 (훈 - 한자의 뜻)
        strokeCount: number;
        isEven: boolean;
        yinYang: YinYangVariant;
    };
    firstName: CharacterInfo & {
        hun: string;
        strokeCount: number;
        isEven: boolean;
        yinYang: YinYangVariant;
    };
    secondName?: CharacterInfo & {
        hun: string;
        strokeCount: number;
        isEven: boolean;
        yinYang: YinYangVariant;
    };
}

export interface SuriPeriod {
    label: string; // Figma: 초년, 청년, 중년, 말년
    detail: string; // Figma: 0세~19세 | 24수
    description: string;
    badgeLabel?: string; // Badge 텍스트 (ex: 대길)
    badgeColor?: 'green' | 'red' | 'orange'; // Badge 색상
}

export interface SuriAnalysisData {
    periods: SuriPeriod[];
}

export interface ElementalBalanceData {
    elements: ElementValues;
    nameElements?: ElementType[];
}

export interface UnluckyCharacterInfo {
    hanja: string;
    readingTitle: string; // Figma: 시, 밝을 (훈)
    reading: string; // Figma: 시, 랑 (음)
    badgeLabel?: string; // Figma: Badge text
    badgeColor?: 'green' | 'orange' | 'red'; // Figma: Badge color
}

export interface UnluckyCharactersData {
    firstName: UnluckyCharacterInfo;
    secondName?: UnluckyCharacterInfo;
}

export interface OrthodoxReportContentProps {
    variant: ContentType;
    pronunciationElements?: PronunciationElementsData;
    fiveElementsTheory?: FiveElementsTheoryData;
    suriAnalysis?: SuriAnalysisData;
    elementalBalance?: ElementalBalanceData;
    unluckyCharacters?: UnluckyCharactersData;
    style?: ViewStyle;
}

// =============================================================================
// Constants
// =============================================================================

const GAP = space[400]; // 16px
const ROW_GAP = space[300]; // 12px

// =============================================================================
// Sub-components
// =============================================================================

// 한자 카드 (발음오행 - 이미지만 표시)
const HanjaCard: React.FC<{
    reading: string;
    subtitle?: string;
    imageSource?: ImageSourcePropType;
}> = ({ reading, subtitle, imageSource }) => (
    <View style={styles.hanjaCard}>
        <View style={styles.hanjaImageWrapper}>
            {imageSource && (
                <Image source={imageSource} style={styles.hanjaImage} />
            )}
        </View>
        <View style={styles.hanjaTextWrapper}>
            {subtitle && <Text style={styles.hanjaSubtitle}>{subtitle}</Text>}
            <Text style={styles.hanjaReading}>{reading}</Text>
        </View>
    </View>
);

// 자원오행 Row (3열: surname, suriInfo, yinYang)
interface FiveElementsRowProps {
    hanja: string;
    reading: string;
    hun: string; // 훈 - 한자의 뜻
    strokeCount: number;
    isEven: boolean;
    yinYang: YinYangVariant;
}

const FiveElementsRow: React.FC<FiveElementsRowProps> = ({
    hanja,
    reading,
    hun,
    strokeCount,
    isEven,
    yinYang,
}) => (
    <View style={styles.fiveElementsRow}>
        {/* 한자 컬럼 - flex: 1 */}
        <View style={styles.fiveElementsColGrow}>
            <Text style={styles.fiveElementsHanja}>{hanja}</Text>
            <View style={styles.fiveElementsTextWrapper}>
                <Text style={styles.fiveElementsHun}>{hun}</Text>
                <Text style={styles.fiveElementsReading}>{reading}</Text>
            </View>
        </View>
        {/* suriInfo 컬럼 - flex: 1 + 수직 가운데 */}
        <View style={styles.fiveElementsColSuriInfo}>
            <Text style={styles.fiveElementsSuriInfo}>
                {strokeCount}획 | {isEven ? '짝수' : '홀수'}
            </Text>
        </View>
        {/* 음양 컬럼 - 고정 너비 */}
        <View style={styles.fiveElementsColFixed}>
            <YinYang variant={yinYang} />
        </View>
    </View>
);

// 수리분석 Row - Figma: row(HORIZONTAL, gap 24)
const SuriRow: React.FC<{ period: SuriPeriod }> = ({ period }) => (
    <View style={styles.suriRow}>
        <View style={styles.suriPeriodWrapper}>
            {/* badgeWrapper: label + Badge */}
            <View style={styles.suriBadgeWrapper}>
                <Text style={styles.suriPeriodLabel}>{period.label}</Text>
                {period.badgeLabel && (
                    <Badge
                        firstLabel={period.badgeLabel}
                        color={period.badgeColor || 'green'}
                        shape="pill"
                        size="small"
                    />
                )}
            </View>
            {/* period detail */}
            <Text style={styles.suriPeriodDetail}>{period.detail}</Text>
        </View>
        <Text style={styles.suriDescription}>{period.description}</Text>
    </View>
);

// Figma: firstLetter (VERTICAL, gap 4, CENTER, HUG)
const UnluckyLetter: React.FC<{ info: UnluckyCharacterInfo }> = ({ info }) => (
    <View style={styles.unluckyLetter}>
        {/* 한자 */}
        <Text style={styles.unluckyHanja}>{info.hanja}</Text>
        {/* Figma: textWrapper (HORIZONTAL, gap 4) */}
        <View style={styles.unluckyTextWrapper}>
            <Text style={styles.unluckyReadingTitle}>{info.readingTitle}</Text>
            <Text style={styles.unluckyReadingName}>{info.reading}</Text>
        </View>
        {/* Figma: badgeWrapper */}
        {info.badgeLabel && (
            <View style={styles.unluckyBadgeWrapper}>
                <Badge firstLabel={info.badgeLabel} color={info.badgeColor || 'green'} size="small" />
            </View>
        )}
    </View>
);

// =============================================================================
// OrthodoxReportContent Component
// =============================================================================

export const OrthodoxReportContent: React.FC<OrthodoxReportContentProps> = ({
    variant,
    pronunciationElements,
    fiveElementsTheory,
    suriAnalysis,
    elementalBalance,
    unluckyCharacters,
    style,
}) => {
    const renderContent = () => {
        switch (variant) {
            case 'pronunciationElements':
                if (!pronunciationElements) return null;
                return (
                    <View style={styles.pronunciationContainer}>
                        <HanjaCard
                            reading={pronunciationElements.surname.reading}
                            subtitle={pronunciationElements.surname.hun}
                            imageSource={pronunciationElements.surname.imageSource}
                        />
                        <HanjaCard
                            reading={pronunciationElements.firstName.reading}
                            subtitle={pronunciationElements.firstName.hun}
                            imageSource={pronunciationElements.firstName.imageSource}
                        />
                        {pronunciationElements.secondName && (
                            <HanjaCard
                                reading={pronunciationElements.secondName.reading}
                                subtitle={pronunciationElements.secondName.hun}
                                imageSource={pronunciationElements.secondName.imageSource}
                            />
                        )}
                    </View>
                );

            case 'fiveElementsTheory':
                if (!fiveElementsTheory) return null;
                return (
                    <View style={styles.fiveElementsContainer}>
                        <FiveElementsRow
                            hanja={fiveElementsTheory.surname.hanja}
                            reading={fiveElementsTheory.surname.reading}
                            hun={fiveElementsTheory.surname.hun}
                            strokeCount={fiveElementsTheory.surname.strokeCount}
                            isEven={fiveElementsTheory.surname.isEven}
                            yinYang={fiveElementsTheory.surname.yinYang}
                        />
                        <FiveElementsRow
                            hanja={fiveElementsTheory.firstName.hanja}
                            reading={fiveElementsTheory.firstName.reading}
                            hun={fiveElementsTheory.firstName.hun}
                            strokeCount={fiveElementsTheory.firstName.strokeCount}
                            isEven={fiveElementsTheory.firstName.isEven}
                            yinYang={fiveElementsTheory.firstName.yinYang}
                        />
                        {fiveElementsTheory.secondName && (
                            <FiveElementsRow
                                hanja={fiveElementsTheory.secondName.hanja}
                                reading={fiveElementsTheory.secondName.reading}
                                hun={fiveElementsTheory.secondName.hun}
                                strokeCount={fiveElementsTheory.secondName.strokeCount}
                                isEven={fiveElementsTheory.secondName.isEven}
                                yinYang={fiveElementsTheory.secondName.yinYang}
                            />
                        )}
                    </View>
                );

            case 'suriAnalysis':
                if (!suriAnalysis) return null;
                return (
                    <View style={styles.suriContainer}>
                        {suriAnalysis.periods.map((period, index) => (
                            <React.Fragment key={period.label}>
                                <SuriRow period={period} />
                                {index < suriAnalysis.periods.length - 1 && (
                                    <View style={styles.suriDivider} />
                                )}
                            </React.Fragment>
                        ))}
                    </View>
                );

            case 'elementalBalance':
                if (!elementalBalance) return null;
                return (
                    <View style={styles.elementalBalanceContainer}>
                        <ElementBarGraph
                            elements={elementalBalance.elements}
                            nameElements={elementalBalance.nameElements}
                        />
                    </View>
                );

            case 'unluckyCharacters':
                if (!unluckyCharacters) return null;
                return (
                    <View style={styles.unluckyContainer}>
                        {/* Figma: row (HORIZONTAL, gap 64, CENTER/CENTER, FILL/HUG) */}
                        <View style={styles.unluckyRow}>
                            <UnluckyLetter info={unluckyCharacters.firstName} />
                            {unluckyCharacters.secondName && (
                                <UnluckyLetter info={unluckyCharacters.secondName} />
                            )}
                        </View>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <Animated.View
            style={[styles.container, style]}
            entering={FadeIn.duration(300)}
        >
            {renderContent()}
        </Animated.View>
    );
};

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
    container: {
        alignSelf: 'stretch', // FILL - 전체 너비 사용
    },
    // Figma: pronunciationElements - HORIZONTAL, gap 32, padding 8/16, SPACE_BETWEEN
    pronunciationContainer: {
        flexDirection: 'row',
        gap: 32, // Figma: gap 32
        justifyContent: 'space-between', // Figma: SPACE_BETWEEN
        alignItems: 'center', // Figma: counterAxisAlignItems CENTER
        paddingHorizontal: 8, // Figma: 8
        paddingVertical: 16, // Figma: 16
    },
    // Figma: nameCard (surname, etc.) - VERTICAL, gap 8, paddingHorizontal 16, HUG/HUG
    hanjaCard: {
        alignItems: 'center', // counterAxisAlignItems: CENTER
        gap: 8, // Figma: gap 8
        paddingHorizontal: 16, // Figma: padding 16
    },
    hanjaImageWrapper: {
        width: 60, // Figma: 60
        height: 80, // Figma: 80
        backgroundColor: colors.background.default.higher,
        borderRadius: 12, // Figma: cornerRadius 12
        justifyContent: 'center',
        alignItems: 'center',
    },
    hanjaImage: {
        width: 60, // Figma: 60
        height: 80, // Figma: 80
        borderRadius: 12, // Figma: cornerRadius 12
        resizeMode: 'cover', // Figma: scaleMode FILL
    },
    hanjaPlaceholder: {
        ...typography.display.lg,
        color: colors.text.default.primary,
    },
    hanjaTextWrapper: {
        flexDirection: 'row', // Figma: HORIZONTAL
        alignItems: 'center', // Figma: counterAxisAlignItems CENTER
        gap: 4, // Figma: gap 4
    },
    hanjaSubtitle: {
        ...typography.label.mdSemiBold, // Figma: 14px/600
        color: colors.text.default.tertiary, // Figma: text/default/tertiary
    },
    hanjaReading: {
        ...typography.label.mdBold,
        color: colors.text.default.primary,
    },
    // Five Elements Theory
    fiveElementsContainer: {
        gap: 32,
        paddingHorizontal: 8,
        paddingVertical: 16,
        flex: 1,
    },
    fiveElementsRow: {
        alignSelf: 'stretch',
        justifyContent: 'space-between',
        gap: 0,
        alignItems: 'center',
        flexDirection: 'row',
    },
    // surname 컬럼 (flex: 1, gap: 4) - Figma: counterAxisAlignItems null
    fiveElementsColGrow: {
        gap: 4,
        flex: 1,
    },
    // suriInfo 컬럼 (flex: 1, alignItems: center)
    fiveElementsColSuriInfo: {
        alignItems: 'center',
        flex: 1,
    },
    // yinYangWrapper (width: 110, alignItems: flex-end, justifyContent: center)
    fiveElementsColFixed: {
        width: 110,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    fiveElementsHanja: {
        ...typography.display.md,
        color: colors.text.default.primary,
        textAlign: 'left', // Figma: textAlignHorizontal LEFT
    },
    fiveElementsTextWrapper: {
        gap: 4, // Figma textwrapper gap: 4
        alignItems: 'center',
        flexDirection: 'row',
    },
    fiveElementsHun: {
        ...typography.label.mdSemiBold, // Figma: 14px/600
        color: colors.text.default.tertiary, // Figma: text/default/tertiary (훈)
    },
    fiveElementsReading: {
        ...typography.label.mdBold,
        color: colors.text.default.primary,
    },
    fiveElementsSuriInfo: {
        ...typography.label.mdSemiBold, // Figma: 14px/600
        color: colors.text.default.tertiary, // Figma: text/default/tertiary
        textAlign: 'center',
    },
    // Suri Analysis - VERTICAL, gap 16, padding 20/16
    suriContainer: {
        gap: 16, // Figma: gap 16
        paddingHorizontal: 8,
        paddingVertical: 16,
    },
    // Figma: row (HORIZONTAL, gap 24, FILL)
    suriRow: {
        flexDirection: 'row', // Figma: HORIZONTAL
        gap: 24, // Figma: gap 24
        alignSelf: 'stretch', // Figma: FILL
    },
    // Figma: period (VERTICAL, gap 6, width 120)
    suriPeriodWrapper: {
        width: 120, // Figma: width 120
        gap: 6, // Figma: gap 6
    },
    // Figma: badgeWrapper (HORIZONTAL, gap 8)
    suriBadgeWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // Figma: gap 8
    },
    suriPeriodLabel: {
        ...typography.label.mdBold, // Figma: 14px/700
        color: colors.text.default.primary, // Figma: text/default/primary
    },
    suriPeriodDetail: {
        ...typography.label.md, // Figma: 14px/500 (Medium)
        color: colors.text.default.tertiary, // Figma: VariableID:5:282
    },
    suriDescription: {
        ...typography.label.md, // Figma: 14px/500 (Medium)
        color: colors.text.default.primary, // Figma: text/default/primary (VariableID:5:279)
        flex: 1, // Figma: layoutGrow 1
    },
    // Figma: divider (height 1, FILL)
    suriDivider: {
        height: 1,
        backgroundColor: colors.background.default.high, // Figma: background/default/high
        alignSelf: 'stretch', // FILL
    },
    divider: {
        height: 1,
        backgroundColor: colors.border.default.weak,
        marginTop: ROW_GAP,
    },
    // Elemental Balance - FILL children, gap 16, padding 20/16
    elementalBalanceContainer: {
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 16,
        gap: 16,
        width: '100%', // FILL
    },
    // Unlucky Characters - FILL children, gap 32, padding 20/16
    unluckyContainer: {
        gap: 32,
        paddingHorizontal: 8,
        paddingVertical: 16,
    },
    // Figma: row (HORIZONTAL, gap 64, CENTER/CENTER, FILL/HUG)
    unluckyRow: {
        flexDirection: 'row',
        gap: 64, // Figma: gap 64
        alignItems: 'center', // Figma: counterAxisAlignItems CENTER
        justifyContent: 'center', // Figma: primaryAxisAlignItems CENTER
        alignSelf: 'stretch', // FILL
    },
    // Figma: firstLetter (VERTICAL, gap 4, CENTER, HUG, padding 12)
    unluckyLetter: {
        gap: 4, // Figma: gap 4
        alignItems: 'center', // Figma: counterAxisAlignItems CENTER
        padding: 12, // Figma: padding 12
    },
    // Figma: textWrapper (HORIZONTAL, gap 4)
    unluckyTextWrapper: {
        flexDirection: 'row',
        gap: 4, // Figma: gap 4
    },
    unluckyHanja: {
        ...typography.display.md, // Figma: 26px/700 - display.md
        color: colors.text.default.primary, // Figma: VariableID:5:279
    },
    unluckyReadingTitle: {
        ...typography.label.mdSemiBold, // Figma: 14px/600
        color: colors.text.default.tertiary, // Figma: VariableID:5:281
    },
    unluckyReadingName: {
        ...typography.label.mdBold, // Figma: 14px/700
        color: colors.text.default.primary,
    },
    // Figma: badgeWrapper
    unluckyBadgeWrapper: {
        // placeholder for any future styles
    },
});

export default OrthodoxReportContent;
