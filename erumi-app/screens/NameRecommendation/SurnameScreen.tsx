/**
 * SurnameScreen - 성씨 선택 화면 (독립적인 Stack.Screen)
 * 홈에서 진입, 스와이프 뒤로가기 가능
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
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

// erumi-core에서 성씨 데이터 가져오기
import surnamesData from 'erumi-core/data/core/surnames.json';

// 타입 정의
interface SurnameVariant {
    hanja: string;
    strokes: number;
    element: string;
    meaning: string;
    examples: string;
    is_major: boolean;
}

type SurnamesDataType = Record<string, SurnameVariant[]>;

// 성씨 선택 인터페이스
export interface SurnameItem {
    id: string;
    hangul: string;
    hanja: string;
}

// 네비게이션 타입
type RootStackParamList = {
    SurnameScreen: { addedSurname?: SurnameItem };
    NameWizard: { surname: SurnameItem };
    SurnameSearch: undefined;
};

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

export const SurnameScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const route = useRoute<RouteProp<RootStackParamList, 'SurnameScreen'>>();

    // 검색에서 돌아왔을 때 추가된 성씨
    const addedSurnameFromSearch = route.params?.addedSurname;

    const [selectedSurname, setSelectedSurname] = useState<string | null>(null);
    const [addedSurnames, setAddedSurnames] = useState<SurnameItem[]>([]);

    // 검색에서 돌아왔을 때 추가된 성씨 처리
    useEffect(() => {
        if (addedSurnameFromSearch && !COMMON_SURNAMES.some(s => s.id === addedSurnameFromSearch.id)) {
            const isAlreadyAdded = addedSurnames.some(s => s.id === addedSurnameFromSearch.id);
            if (!isAlreadyAdded) {
                setAddedSurnames(prev => [...prev, addedSurnameFromSearch]);
            }
            setSelectedSurname(addedSurnameFromSearch.id);
        }
    }, [addedSurnameFromSearch]);

    const displaySurnames = useMemo(() => {
        return [...COMMON_SURNAMES, ...addedSurnames];
    }, [addedSurnames]);

    const handleBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const handleSurnameSelect = (id: string) => {
        setSelectedSurname(prev => prev === id ? null : id);
    };

    const handleRemoveAddedSurname = (id: string) => {
        setAddedSurnames(prev => prev.filter(s => s.id !== id));
        if (selectedSurname === id) {
            setSelectedSurname(null);
        }
    };

    const handleMorePress = useCallback(() => {
        (navigation as any).navigate('SurnameSearch');
    }, [navigation]);

    const handleNext = useCallback(() => {
        const surname = displaySurnames.find(s => s.id === selectedSurname);
        if (surname) {
            // NameWizard로 이동하면서 성씨 데이터 전달
            (navigation as any).navigate('NameWizard', { surname });
        }
    }, [displaySurnames, selectedSurname, navigation]);

    // 전체 아이템 = 성씨들 + 더보기
    const totalItems = displaySurnames.length + 1;
    const remainder = totalItems % COLUMNS;
    const placeholderCount = remainder === 0 ? 0 : COLUMNS - remainder;

    const isNextEnabled = selectedSurname !== null;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Topbar */}
            <Topbar
                location="page"
                title="성씨"
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

            {/* Pagination - 7페이지 중 첫 번째 */}
            <Pagination
                totalPages={7}
                currentPage={0}
                scrollPosition={0}
            />

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
                    onPress={handleNext}
                    style={styles.nextButton}
                >
                    다음
                </Button>
            </View>

            {/* Safe Area Bottom */}
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

export default SurnameScreen;
