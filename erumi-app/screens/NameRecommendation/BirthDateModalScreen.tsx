/**
 * BirthDateModalScreen - 사주정보 입력 모달 스크린
 * ReportScreen에서 placeholder 버튼 클릭 시 열리는 모달
 * 
 * Figma: 532:3376 (birthdateModal)
 * - Topbar: title "생년월일", trailing item "홈으로" 아이콘, leading item 없음
 * - ContentSection: questionFrame + vScrollContainer(inputWrapper)
 * - BottomBar: 저장 버튼
 * 
 * 입력 완료 후 route.params.onComplete 콜백으로 결과 전달
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    Topbar,
    TopbarItem,
    Icon,
    SelectionInput,
    Button,
    Dialog,
    DialogItem,
    SelectItem,
    colors,
    space,
    typography,
    radius,
} from '../../design-system';

// =============================================================================
// Types
// =============================================================================

export interface BirthDateResult {
    birthDate: Date;
    birthTime?: string;
}

type RootStackParamList = {
    BirthDateModal: {
        onComplete?: (result: BirthDateResult) => void;
    };
};

type BirthDateModalRouteProp = RouteProp<RootStackParamList, 'BirthDateModal'>;

// =============================================================================
// Constants
// =============================================================================

// 날짜 포맷 함수
const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
};

// 12시진 옵션
const ZODIAC_TIME_OPTIONS = [
    { id: 'ja', label: '자시(子時) 23:00~01:00' },
    { id: 'chuk', label: '축시(丑時) 01:00~03:00' },
    { id: 'in', label: '인시(寅時) 03:00~05:00' },
    { id: 'myo', label: '묘시(卯時) 05:00~07:00' },
    { id: 'jin', label: '진시(辰時) 07:00~09:00' },
    { id: 'sa', label: '사시(巳時) 09:00~11:00' },
    { id: 'o', label: '오시(午時) 11:00~13:00' },
    { id: 'mi', label: '미시(未時) 13:00~15:00' },
    { id: 'sin', label: '신시(申時) 15:00~17:00' },
    { id: 'yu', label: '유시(酉時) 17:00~19:00' },
    { id: 'sul', label: '술시(戌時) 19:00~21:00' },
    { id: 'hae', label: '해시(亥時) 21:00~23:00' },
];

// =============================================================================
// Component
// =============================================================================

export const BirthDateModalScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const route = useRoute<BirthDateModalRouteProp>();

    // 생년월일
    const [birthDate, setBirthDate] = useState<Date | null>(null);
    // 태어난 시간 (시진)
    const [birthTime, setBirthTime] = useState<string | null>(null);

    // 날짜 피커 다이얼로그 표시 여부
    const [showDateDialog, setShowDateDialog] = useState(false);
    // 시진 다이얼로그 표시 여부
    const [showTimeDialog, setShowTimeDialog] = useState(false);

    // 클릭한 시진 아이템 추적 (선택 색상 변화 방지용)
    const clickedTimeRef = React.useRef<string | null>(null);

    // 임시 선택 값 (다이얼로그에서 사용)
    const [tempDate, setTempDate] = useState<Date>(new Date());
    const [tempTime, setTempTime] = useState<string | null>(null);

    // 닫기/홈으로
    const handleClose = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const handleOpenDateDialog = () => {
        setTempDate(birthDate || new Date());
        setShowDateDialog(true);
    };

    const handleOpenTimeDialog = () => {
        clickedTimeRef.current = null; // 다이얼로그 열릴 때 초기화
        setTempTime(birthTime);
        setShowTimeDialog(true);
    };

    const handleDateChange = (_event: any, selectedDate?: Date) => {
        if (selectedDate) {
            setTempDate(selectedDate);
        }
    };

    const handleConfirmDate = () => {
        setBirthDate(tempDate);
    };

    const handleConfirmTime = () => {
        if (tempTime) {
            setBirthTime(tempTime);
        }
    };

    // 저장 버튼 클릭
    const handleSave = useCallback(() => {
        if (birthDate) {
            const result: BirthDateResult = {
                birthDate,
                birthTime: birthTime ?? undefined,
            };
            // 콜백으로 결과 전달
            route.params?.onComplete?.(result);
            navigation.goBack();
        }
    }, [birthDate, birthTime, navigation, route.params]);

    // 생년월일 + 태어난 시간 모두 입력되어야 저장 버튼 활성화
    const isSaveEnabled = birthDate !== null && birthTime !== null;

    // 선택된 시진 라벨
    const selectedTimeLabel = birthTime
        ? ZODIAC_TIME_OPTIONS.find(o => o.id === birthTime)?.label
        : undefined;

    return (
        <View style={styles.modalContainer}>
            {/* Topbar: title "생년월일", trailing "X Mark" 아이콘, no leading */}
            <Topbar
                location="page"
                title="생년월일"
                trailingItems={
                    <TopbarItem
                        status="icon"
                        icon={<Icon name="X Mark" size={24} />}
                        onPress={handleClose}
                    />
                }
            />

            {/* ContentSection */}
            <View style={styles.contentSection}>
                {/* questionFrame */}
                <View style={styles.questionFrame}>
                    <Text style={styles.questionTitle}>
                        세상에 처음{"\n"}도착한 시간은 언제인가요?
                    </Text>
                    <Text style={styles.questionSubtitle}>
                        생년월일과 태어난 시간을 알려주세요.
                    </Text>
                </View>

                {/* vScrollContainer > inputWrapper */}
                <View style={styles.inputWrapper}>
                    {/* 생년월일 */}
                    <SelectionInput
                        shape="rectangle"
                        showLabel={true}
                        label="생년월일"
                        placeholder="생년월일을 선택해주세요."
                        value={birthDate ? formatDate(birthDate) : undefined}
                        onPress={handleOpenDateDialog}
                        showTrailingIcon={!!birthDate}
                        onTrailingIconPress={() => setBirthDate(null)}
                    />

                    {/* 태어난 시간 */}
                    <SelectionInput
                        shape="rectangle"
                        showLabel={true}
                        label="태어난 시간"
                        placeholder="태어난 시간을 선택해주세요."
                        value={selectedTimeLabel}
                        onPress={handleOpenTimeDialog}
                        showTrailingIcon={!!birthTime}
                        onTrailingIconPress={() => setBirthTime(null)}
                    />
                </View>
            </View>

            {/* BottomBar */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
                <Button
                    variant="primary"
                    size="large"
                    disabled={!isSaveEnabled}
                    haptic
                    onPress={handleSave}
                    style={styles.saveButton}
                >
                    저장
                </Button>
            </View>

            {/* Date Picker Dialog */}
            <Dialog
                visible={showDateDialog}
                onClose={() => setShowDateDialog(false)}
                onConfirm={handleConfirmDate}
                confirmText="선택"
                contentStyle={styles.pickerContent}
            >
                <DialogItem variant="dateAndTimeWheel" style={{ minHeight: 220 }}>
                    <DateTimePicker
                        value={tempDate}
                        mode="date"
                        display="spinner"
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                        locale="ko-KR"
                        style={{ flex: 1, width: '100%' }}
                    />
                </DialogItem>
            </Dialog>

            {/* Zodiac Time Picker Dialog - 즉시 반영, 버튼 없음 */}
            <Dialog
                visible={showTimeDialog}
                onClose={() => setShowTimeDialog(false)}
                showBottomBar={false}
            >
                <DialogItem
                    variant="zodiacTime"
                    maxHeight={280}
                    initialScrollIndex={ZODIAC_TIME_OPTIONS.findIndex(o => o.id === birthTime)}
                >
                    {ZODIAC_TIME_OPTIONS.map((option) => (
                        <SelectItem
                            key={option.id}
                            status="medium"
                            label={option.label}
                            selected={clickedTimeRef.current === null && birthTime === option.id}
                            disablePressEffect={true}
                            onPress={() => {
                                clickedTimeRef.current = option.id;
                                setShowTimeDialog(false);
                                setBirthTime(option.id);
                            }}
                        />
                    ))}
                </DialogItem>
            </Dialog>
        </View>
    );
};

// =============================================================================
// Styles (Figma: 532:3376 birthdateModal)
// =============================================================================

const styles = StyleSheet.create({
    // 모달 컨테이너: 상단만 둥글게 (32/32/0/0), 배경 #FCF8F0
    modalContainer: {
        flex: 1,
        backgroundColor: colors.background.default.highest, // #FCF8F0
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: 'hidden',
    },
    // ContentSection: padding 20/16, gap 32
    contentSection: {
        flex: 1,
        paddingHorizontal: space[500], // 20
        paddingTop: space[400], // 16
        paddingBottom: space[400], // 16
        gap: space[800], // 32
    },
    // questionFrame: gap 8
    questionFrame: {
        gap: space[200], // 8
    },
    questionTitle: {
        ...typography.heading.lg,
        color: colors.text.default.primary, // #332C21
    },
    questionSubtitle: {
        ...typography.label.md,
        color: colors.text.default.tertiary, // #AEA393
    },
    // inputWrapper: gap 24
    inputWrapper: {
        flex: 1,
        gap: space[600], // 24
    },
    // BottomBar: padding 20/12
    bottomBar: {
        paddingHorizontal: space[500], // 20
        paddingVertical: space[300], // 12
    },
    saveButton: {
        alignSelf: 'stretch',
    },
    pickerContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default BirthDateModalScreen;
