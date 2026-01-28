/**
 * SurnameSearchScreen - 성씨 검색 화면
 * '더보기' 버튼 클릭 시 표시되는 성씨 검색 화면
 * erumi-core의 성씨 데이터베이스 사용
 */
import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Keyboard, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SurnameItem } from './SurnameScreen';
import {
    Topbar,
    TopbarItem,
    SearchInput,
    SelectItem,
    Icon,
    colors,
    space,
} from '../../design-system';

// erumi-core에서 성씨 데이터 가져오기
import surnamesData from 'erumi-core/data/core/surnames.json';

// 타입 정의 (erumi-core의 SurnameVariant와 동일)
interface SurnameVariant {
    hanja: string;
    strokes: number;
    element: string;
    meaning: string;
    examples: string;
    is_major: boolean;
}

type SurnamesDataType = Record<string, SurnameVariant[]>;

// 검색 결과용 인터페이스
export interface SurnameSearchResult {
    id: string;       // 고유 ID (hangul + hanja)
    hangul: string;   // 한글 성씨
    hanja: string;    // 한자 성씨
    strokes: number;  // 획수
    isMajor: boolean; // 주요 성씨 여부
}

// 그리드 설정: 4열, gap 6
const COLUMNS = 4;
const GAP = space[150]; // 6
const SCREEN_PADDING = space[400]; // 16
const screenWidth = Dimensions.get('window').width;
const ITEM_WIDTH = (screenWidth - SCREEN_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

/**
 * 성씨 검색 함수
 * @param query 검색어 (한글)
 * @returns 매칭되는 성씨 목록
 */
const searchSurnames = (query: string): SurnameSearchResult[] => {
    if (!query.trim()) {
        return [];
    }

    const normalizedQuery = query.trim();
    const results: SurnameSearchResult[] = [];
    const data = surnamesData as SurnamesDataType;

    // 모든 성씨를 순회하며 검색
    for (const [hangul, variants] of Object.entries(data)) {
        if (hangul.includes(normalizedQuery)) {
            // 매칭되는 성씨의 모든 한자 변형 추가
            for (const variant of variants) {
                results.push({
                    id: `${hangul}_${variant.hanja}`,
                    hangul,
                    hanja: variant.hanja,
                    strokes: variant.strokes,
                    isMajor: variant.is_major,
                });
            }
        }
    }

    // 주요 성씨 우선, 획수 순으로 정렬
    return results.sort((a, b) => {
        if (a.isMajor !== b.isMajor) return a.isMajor ? -1 : 1;
        return a.strokes - b.strokes;
    });
};

// 네비게이션 타입
type RootStackParamList = {
    NameWizard: { addedSurname?: SurnameItem };
    SurnameSearch: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SurnameSearch'>;

// 모달/스택 양쪽에서 사용 가능하도록 props 추가
interface SurnameSearchScreenProps {
    /** 성씨 선택 시 콜백 (모달용) */
    onSelect?: (surname: { id: string; hangul: string; hanja: string }) => void;
    /** 닫기 콜백 (모달용) */
    onClose?: () => void;
}

export const SurnameSearchScreen: React.FC<SurnameSearchScreenProps> = ({
    onSelect,
    onClose,
}) => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NavigationProp>();
    const [searchText, setSearchText] = useState('');

    // 모달 모드인지 확인
    const isModalMode = !!onSelect;

    // 검색 결과
    const searchResults = useMemo(() => {
        return searchSurnames(searchText);
    }, [searchText]);

    // 마지막 줄 placeholder 개수 계산
    const placeholderCount = useMemo(() => {
        if (searchResults.length === 0) return 0;
        const remainder = searchResults.length % COLUMNS;
        return remainder === 0 ? 0 : COLUMNS - remainder;
    }, [searchResults]);

    const handleBack = () => {
        if (isModalMode) {
            onClose?.();
        } else {
            navigation.goBack();
        }
    };

    const handleSearchChange = (text: string) => {
        setSearchText(text);
    };

    const handleSurnameSelect = (surname: SurnameSearchResult) => {
        const surnameData = {
            id: surname.id,
            hangul: surname.hangul,
            hanja: surname.hanja,
        };

        if (isModalMode) {
            // 모달 모드: 콜백 호출
            onSelect?.(surnameData);
        } else {
            // 스택 네비게이션 모드: NameWizard로 돌아가며 데이터 전달
            navigation.dispatch((state) => {
                const prevRoutes = state.routes.slice(0, -1);

                const updatedRoutes = prevRoutes.map((route) => {
                    if (route.name === 'NameWizard') {
                        return {
                            ...route,
                            params: {
                                ...(route.params as object || {}),
                                addedSurname: surnameData,
                            },
                        };
                    }
                    return route;
                });

                return CommonActions.reset({
                    ...state,
                    routes: updatedRoutes,
                    index: updatedRoutes.length - 1,
                });
            });
        }
    };

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    return (
        <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
            <View style={[styles.container, { paddingTop: insets.top }]}>
                {/* Topbar - location: page, title: 성씨 검색 */}
                <Topbar
                    location="page"
                    title="성씨 검색"
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

                {/* Search Section */}
                <View style={styles.searchSection}>
                    <SearchInput
                        placeholder="성씨를 검색해주세요."
                        value={searchText}
                        onChangeText={handleSearchChange}
                        autoFocus={true}
                    />
                </View>

                {/* Search Results Grid */}
                <View style={styles.contentArea}>
                    {searchResults.length > 0 && (
                        <View style={styles.resultsGrid}>
                            {searchResults.map((surname) => (
                                <SelectItem
                                    key={surname.id}
                                    status="medium"
                                    label={`${surname.hangul}(${surname.hanja})`}
                                    onPress={() => handleSurnameSelect(surname)}
                                    style={styles.gridItem}
                                />
                            ))}
                            {/* 마지막 줄 정렬용 Placeholder */}
                            {Array.from({ length: placeholderCount }).map((_, index) => (
                                <View key={`placeholder-${index}`} style={styles.placeholderItem} />
                            ))}
                        </View>
                    )}
                </View>

                {/* Safe Area Bottom Padding */}
                <View style={{ height: insets.bottom > 0 ? insets.bottom : 34 }} />
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.default.highest,
    },
    searchSection: {
        padding: space[400], // 16
    },
    contentArea: {
        flex: 1,
        padding: space[400], // 16
    },
    resultsGrid: {
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
});

export default SurnameSearchScreen;
