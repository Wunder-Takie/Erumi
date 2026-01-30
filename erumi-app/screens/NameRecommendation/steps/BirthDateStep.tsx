/**
 * BirthDateStep - 생년월일 선택 스텝 (위자드용)
 * WizardContainer 내부에서 렌더링되는 스텝 컴포넌트
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    SelectionInput,
    Button,
    Dialog,
    DialogItem,
    SelectItem,
    colors,
    space,
} from '../../../design-system';
import { WizardStepProps, WizardData } from '../WizardContainer';

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
    { id: 'unknown', label: '모름' },
];

export const BirthDateStep: React.FC<WizardStepProps> = ({
    goNext,
    data,
    updateData,
}) => {
    // 생년월일
    const [birthDate, setBirthDate] = useState<Date | null>(data.birthDate ?? null);
    // 태어난 시간 (시진)
    const [birthTime, setBirthTime] = useState<string | null>(
        typeof data.birthTime === 'string' ? data.birthTime : null
    );

    // 날짜 피커 다이얼로그 표시 여부
    const [showDateDialog, setShowDateDialog] = useState(false);
    // 시진 다이얼로그 표시 여부
    const [showTimeDialog, setShowTimeDialog] = useState(false);

    // 임시 선택 값 (다이얼로그에서 사용)
    const [tempDate, setTempDate] = useState<Date>(new Date());
    const [tempTime, setTempTime] = useState<string | null>(null);

    const handleOpenDateDialog = () => {
        setTempDate(birthDate || new Date());
        setShowDateDialog(true);
    };

    const handleOpenTimeDialog = () => {
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
        updateData({ birthDate: tempDate });
    };

    const handleConfirmTime = () => {
        if (tempTime) {
            setBirthTime(tempTime);
            updateData({ birthTime: tempTime });
        }
    };

    const handleNext = () => {
        if (birthDate) {
            updateData({ birthDate, birthTime: birthTime ?? undefined });
            goNext();
        }
    };

    const handleSkip = () => {
        // 생년월일 없이 다음으로
        goNext();
    };

    const isNextEnabled = birthDate !== null;

    // 선택된 시진 라벨
    const selectedTimeLabel = birthTime
        ? ZODIAC_TIME_OPTIONS.find(o => o.id === birthTime)?.label
        : undefined;

    return (
        <View style={styles.container}>
            {/* Content Section */}
            <View style={styles.contentSection}>
                {/* Page Header */}
                <View style={styles.pageHeader}>
                    <Text style={styles.title}>
                        세상에 처음{'\n'}도착한 시간은 언제인가요?
                    </Text>
                    <Text style={styles.subtitle}>
                        생년월일과 태어난 시간을 알려주세요.
                    </Text>
                </View>

                {/* Input Fields */}
                <View style={styles.inputsContainer}>
                    {/* 생년월일 */}
                    <SelectionInput
                        shape="rectangle"
                        showLabel={true}
                        label="생년월일"
                        placeholder="생년 월일을 선택해주세요."
                        value={birthDate ? formatDate(birthDate) : undefined}
                        onPress={handleOpenDateDialog}
                    />

                    {/* 태어난 시간 */}
                    <SelectionInput
                        shape="rectangle"
                        showLabel={true}
                        label="태어난 시간"
                        placeholder="태어난 시간을 선택해주세요."
                        value={selectedTimeLabel}
                        onPress={handleOpenTimeDialog}
                    />
                </View>
            </View>

            {/* Skip Button */}
            <View style={styles.skipSection}>
                <Pressable onPress={handleSkip} style={styles.skipButton}>
                    <Text style={styles.skipText}>
                        몰라도 괜찮아요.(건너뛰기)
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

            {/* Zodiac Time Picker Dialog */}
            <Dialog
                visible={showTimeDialog}
                onClose={() => setShowTimeDialog(false)}
                onConfirm={handleConfirmTime}
                confirmText="선택"
            >
                <DialogItem variant="zodiacTime" maxHeight={280}>
                    {ZODIAC_TIME_OPTIONS.map((option) => (
                        <SelectItem
                            key={option.id}
                            status="medium"
                            label={option.label}
                            selected={tempTime === option.id}
                            onPress={() => setTempTime(option.id)}
                        />
                    ))}
                </DialogItem>
            </Dialog>
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
    inputsContainer: {
        flex: 1,
        gap: space[600], // 24
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
        color: colors.text.default.tertiary,
    },
    bottomSection: {
        paddingHorizontal: space[500], // 20
        paddingVertical: space[300], // 12
    },
    nextButton: {
        alignSelf: 'stretch',
    },
    pickerContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default BirthDateStep;
