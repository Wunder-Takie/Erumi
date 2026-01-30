/**
 * SurnameStep - 성씨 선택 스텝 (위자드용)
 * WizardContainer 내부에서 렌더링되는 첫 번째 스텝
 */
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import {
    SelectItem,
    Button,
    colors,
    space,
} from '../../../design-system';
import { WizardStepProps } from '../WizardContainer';
import { SurnameItem, SurnamesDataType } from '../types';

// erumi-core에서 성씨 데이터 가져오기
import surnamesData from 'erumi-core/data/core/surnames.json';

// 그리드 설정: 4열, gap 6
const COLUMNS = 4;
const GAP = space[150]; // 6
const SCREEN_PADDING = space[500]; // 20
const screenWidth = Dimensions.get('window').width;
const ITEM_WIDTH = (screenWidth - SCREEN_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

// 기본 표시할 주요 성씨 목록
const MAJOR_SURNAME_ORDER = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'];

const getCommonSurnames = (): SurnameItem[] => {
    const data = surnamesData as SurnamesDataType;
    const result: SurnameItem[] = [];

    for (const hangul of MAJOR_SURNAME_ORDER) {
        const variants = data[hangul];
        if (variants) {
            const majorVariant = variants.find(v => v.is_major) || variants[0];
            result.push({
                id: `${hangul}_${majorVariant.hanja}`,
                hangul,
                hanja: majorVariant.hanja,
            });
        }
    }

    return result;
};

const COMMON_SURNAMES = getCommonSurnames();

export const SurnameStep: React.FC<WizardStepProps> = ({
    goNext,
    data,
    updateData,
    openSurnameSearch, // 검색 화면 열기 콜백
}) => {
    const [selectedSurname, setSelectedSurname] = useState<string | null>(
        data.surname?.id || null
    );
    const [addedSurnames, setAddedSurnames] = useState<SurnameItem[]>([]);

    // 검색에서 돌아왔을 때 성씨 처리
    useEffect(() => {
        if (data.surname) {
            // 선택 상태 업데이트 (COMMON_SURNAMES에 있든 없든)
            setSelectedSurname(data.surname.id);

            // COMMON_SURNAMES에 없는 성씨는 addedSurnames에 추가
            if (!COMMON_SURNAMES.some(s => s.id === data.surname?.id)) {
                const isAlreadyAdded = addedSurnames.some(s => s.id === data.surname?.id);
                if (!isAlreadyAdded) {
                    setAddedSurnames(prev => [...prev, data.surname as SurnameItem]);
                }
            }
        }
    }, [data.surname]);

    const displaySurnames = useMemo(() => {
        return [...COMMON_SURNAMES, ...addedSurnames];
    }, [addedSurnames]);

    const handleSurnameSelect = (id: string) => {
        setSelectedSurname(prev => prev === id ? null : id);
    };

    const handleRemoveAddedSurname = (id: string) => {
        setAddedSurnames(prev => prev.filter(s => s.id !== id));
        if (selectedSurname === id) {
            setSelectedSurname(null);
        }
    };

    const handleMorePress = () => {
        // 검색 화면 열기 (WizardContainer에서 처리)
        openSurnameSearch?.();
    };

    const handleNext = () => {
        const surname = displaySurnames.find(s => s.id === selectedSurname);
        if (surname) {
            updateData({ surname });
            goNext();
        }
    };

    // 전체 아이템 = 성씨들 + 더보기
    const totalItems = displaySurnames.length + 1;
    const remainder = totalItems % COLUMNS;
    const placeholderCount = remainder === 0 ? 0 : COLUMNS - remainder;

    const isNextEnabled = selectedSurname !== null;

    return (
        <View style={styles.container}>
            {/* Content Section */}
            <View style={styles.contentSection}>
                {/* Page Header */}
                <View style={styles.pageHeader}>
                    <Text style={styles.title}>
                        이름의 첫 글자, {'\n'}성(姓)은 무엇인가요?
                    </Text>
                    <Text style={styles.subtitle}>
                        '더보기'를 눌러서 목록에 없는 성씨를 검색할 수 있어요.
                    </Text>
                </View>

                {/* Surname Grid */}
                <View style={styles.surnameGrid}>
                    {/* 기본 성씨들 */}
                    {COMMON_SURNAMES.map((surname) => (
                        <SelectItem
                            key={surname.id}
                            status="medium"
                            label={`${surname.hangul}(${surname.hanja})`}
                            selected={selectedSurname === surname.id}
                            onPress={() => handleSurnameSelect(surname.id)}
                            style={styles.gridItem}
                        />
                    ))}

                    {/* 추가된 성씨들 (close 버튼 표시) */}
                    {addedSurnames.map((surname) => (
                        <SelectItem
                            key={surname.id}
                            status="medium"
                            label={`${surname.hangul}(${surname.hanja})`}
                            selected={selectedSurname === surname.id}
                            showCloseButton={true}
                            onClosePress={() => handleRemoveAddedSurname(surname.id)}
                            onPress={() => handleSurnameSelect(surname.id)}
                            style={styles.gridItem}
                        />
                    ))}

                    {/* 더보기 버튼 */}
                    <SelectItem
                        status="medium"
                        label="더보기"
                        onPress={handleMorePress}
                        style={styles.gridItem}
                    />

                    {/* Placeholder */}
                    {Array.from({ length: placeholderCount }).map((_, index) => (
                        <View key={`placeholder-${index}`} style={styles.placeholderItem} />
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
    surnameGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        rowGap: space[100], // 4
        columnGap: GAP, // 6
    },
    gridItem: {
        width: ITEM_WIDTH,
    },
    placeholderItem: {
        width: ITEM_WIDTH,
        height: 64,
        opacity: 0,
    },
    bottomSection: {
        paddingHorizontal: space[500], // 20
        paddingVertical: space[300], // 12
    },
    nextButton: {
        alignSelf: 'stretch',
    },
});

export default SurnameStep;
