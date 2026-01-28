/**
 * NameWizardScreen - 이름 추천 위자드 화면
 * 
 * 성씨 선택부터 시작하는 전체 위자드 플로우
 */
import React, { useCallback } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { WizardContainer, WizardStep, WizardData } from './WizardContainer';
import { SurnameStep, GenderStep, BirthDateStep, StoryStep, VibeStep, StyleStep, LoadingStep, ResultStep } from './steps';

// 네비게이션 타입
type RootStackParamList = {
    NameWizard: { addedSurname?: { id: string; hangul: string; hanja: string } };
    SurnameSearch: undefined;
};

// 위자드 스텝 정의
const WIZARD_STEPS: WizardStep[] = [
    {
        key: 'surname',
        title: '성씨',
        content: (props) => <SurnameStep {...props} />,
    },
    {
        key: 'gender',
        title: '성별',
        content: (props) => <GenderStep {...props} />,
    },
    {
        key: 'birthDate',
        title: '생년월일',
        content: (props) => <BirthDateStep {...props} />,
    },
    {
        key: 'story',
        title: '스토리',
        content: (props) => <StoryStep {...props} />,
    },
    {
        key: 'vibe',
        title: '바이브',
        content: (props) => <VibeStep {...props} />,
    },
    {
        key: 'style',
        title: '스타일',
        content: (props) => <StyleStep {...props} />,
    },
    {
        key: 'loading',
        title: '로딩',
        content: (props) => <LoadingStep {...props} />,
        hideHeader: true, // 로딩 화면에서는 헤더 숨김
    },
    {
        key: 'result',
        title: '결과',
        content: (props) => <ResultStep {...props} />,
        hideHeader: true, // 결과 화면에서도 자체 Topbar 사용
    },
];

export const NameWizardScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<RootStackParamList, 'NameWizard'>>();

    // 검색에서 돌아왔을 때 추가된 성씨
    const addedSurnameFromSearch = route.params?.addedSurname;

    const handleComplete = (data: WizardData) => {
        console.log('Wizard completed with data:', data);
        // TODO: 다음 화면으로 이동 또는 이름 생성 로직
    };

    const handleOpenSurnameSearch = useCallback(() => {
        // 스택 네비게이션으로 검색 화면 열기
        (navigation as any).navigate('SurnameSearch');
    }, [navigation]);

    return (
        <WizardContainer
            steps={WIZARD_STEPS}
            totalPages={7}
            startPage={0}
            initialData={{ surname: addedSurnameFromSearch }}
            onComplete={handleComplete}
            onOpenSurnameSearch={handleOpenSurnameSearch}
        />
    );
};

export default NameWizardScreen;
