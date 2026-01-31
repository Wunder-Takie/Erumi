/**
 * ReportScreen - 이름 분석 리포트 화면
 * '풀이보기' 버튼 클릭 시 표시되는 상세 분석 화면
 * 
 * Figma Node: 431-6842 (NameRecommendation/NameResult/Unlocked/Report)
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    useWindowDimensions,
    FlatList,
    ViewToken,
    Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
    Topbar,
    TopbarItem,
    Icon,
    Pagination,
    OrthodoxReport,
    PronunciationElementsData,
    FiveElementsTheoryData,
    SuriAnalysisData,
    ElementalBalanceData,
    UnluckyCharactersData,
    ContentType,
    colors,
    space,
    radius,
} from '../../design-system';
import { namingService } from './services/namingService';
import { useNameGeneration } from './hooks/useNameGeneration';
import { NameReport } from 'erumi-core';

// =============================================================================
// Types
// =============================================================================
interface NameCharacter {
    hanja: string;
    meaning: string;
    pronunciation: string;
}

interface MeaningCardItem {
    title: string;
    description: string;
}

interface MeaningCard {
    items: MeaningCardItem[]; // First card has 2 items, others have 1
}

interface NameVibeItem {
    title: string;
    description: string;
}

interface ReportData {
    nameKr: string;
    nameHanja: string;
    surname: {
        hanja: string;
        meaning: string;
        pronunciation: string;
        strokes: number;
        yinYang: '음' | '양';
    };
    characters: NameCharacter[];
    summary: string;
    meaningCards: MeaningCard[];
    orthodoxReport: {
        yinYang: string;
        pronunciation: string;
        numerology: string;
        element: string;
        unusedChars: string;
    };
    nameVibes: NameVibeItem[];
}

// =============================================================================
// Dummy Data
// =============================================================================
const DUMMY_REPORT: ReportData = {
    nameKr: '시랑',
    nameHanja: '詩朗',
    surname: {
        hanja: '金',
        meaning: '쇠',
        pronunciation: '김',
        strokes: 8,
        yinYang: '음',
    },
    characters: [
        { hanja: '詩', meaning: '시', pronunciation: '시' },
        { hanja: '朗', meaning: '밝을', pronunciation: '랑' },
    ],
    summary: '시처럼 아름다운 감수성과 명랑한 마음을 품고, 낭만적이고 환하게 빛나는 인생을 살아가길 바라는 이름이에요.',
    meaningCards: [
        {
            // First card: hanja字義 meanings (gap: 24)
            items: [
                {
                    title: '詩: 시, 문학, 풍부한 감성, 마음을 표현하다.',
                    description: '자신의 생각과 감정을 아름다운 언어로 표현하는 문학적 재능과 풍부한 감수성을 상징하며, 정서적으로 깊이 있는 내면을 의미해요.',
                },
                {
                    title: '朗: 밝다, 환하다, (소리가) 맑다, 명랑하다.',
                    description: '달빛처럼 환하고 목소리가 맑은 것을 뜻하며, 성격이 구김살 없이 쾌활하고 앞날이 훤히 트인다는 긍정적인 메시지를 담고 있어요.',
                },
            ],
        },
        {
            // Second card: combined meanings (gap: 8)
            items: [
                {
                    title: '맑은 목소리와 뛰어난 표현력',
                    description: '맑은 소리(朗)와 깊은 표현력(詩)을 겸비하여, 자신의 뜻을 세상에 명확하고 조리 있게 전달하는 리더나 예술가로 성장하라는 뜻이에요.',
                },
                {
                    title: '명랑하고 구김살 없는 예술가',
                    description: '섬세한 재능을 지녔으면서도 예민함 대신, 구김살 없이 밝고 명랑한 에너지로 주변에 즐거움을 주는 사람이 되라는 축복을 담고 있어요.',
                },
            ],
        },
    ],
    orthodoxReport: {
        yinYang: "'음' 기운이 강하지만 '양'의 기운도 적절히 조화되어 있어서 안정감을 주는 이름이에요. 내면의 평화를 유지하며 조화로운 삶을 살아갈 수 있음을 의미해요.",
        pronunciation: '발음오행 풀이 내용...',
        numerology: '수리성명학 풀이 내용...',
        element: '자원오행 풀이 내용...',
        unusedChars: '불용문자 풀이 내용...',
    },
    nameVibes: [
        {
            title: '낭만적이고 유니크함',
            description: '흔하지 않은 발음이라 기억에 오래 남으며, 마치 소설이나 웹툰 속 주인공처럼 낭만적이고 신비로운 분위기를 자아내요.',
        },
        {
            title: '청량하고 밝은 이미지',
            description: "'사랑'과 발음이 비슷해 사랑스러운 느낌을 주며, 맑고 깨끗한 소년/소녀의 이미지가 연상되는 청량한 이름이에요.",
        },
        {
            title: '영어 표기 추천',
            description: 'Si-rang, Shirang 등 외국인이 발음하기 좋으면서도 이름의 느낌을 살리는 표기법을 추천해 드릴 수 있어요.',
        },
    ],
};

// =============================================================================
// Orthodox Report Dummy Data
// =============================================================================
const DUMMY_ORTHODOX_DATA = {
    pronunciationElements: {
        surname: { hanja: '金', reading: '김', hun: '쇠' },
        firstName: { hanja: '詩', reading: '시', hun: '시' },
        secondName: { hanja: '朗', reading: '랑', hun: '밝을' },
    } as PronunciationElementsData,

    fiveElementsTheory: {
        surname: { hanja: '金', reading: '김', hun: '쇠', strokeCount: 8, isEven: true, yinYang: 'yin' as const },
        firstName: { hanja: '詩', reading: '시', hun: '시', strokeCount: 13, isEven: false, yinYang: 'yang' as const },
        secondName: { hanja: '朗', reading: '랑', hun: '밝을', strokeCount: 11, isEven: false, yinYang: 'yang' as const },
    } as FiveElementsTheoryData,

    suriAnalysis: {
        periods: [
            { label: '초년', detail: '0세~19세 | 24수', description: '부모의 그늘 없이도, 일찍부터 자신의 재능으로 두각을 나타내는 시기입니다.', badgeLabel: '대길', badgeColor: 'green' as const },
            { label: '청년', detail: '20세~39세 | 32수', description: '꾸준한 노력으로 사회적 기반을 다지고 성장하는 시기입니다.', badgeLabel: '길', badgeColor: 'green' as const },
            { label: '중년', detail: '40세~59세 | 37수', description: '그동안의 노력이 결실을 맺고 안정을 찾는 시기입니다.', badgeLabel: '길', badgeColor: 'green' as const },
            { label: '말년', detail: '60세~ | 45수', description: '평안하고 여유로운 노후를 보내며 후손의 복을 누리는 시기입니다.', badgeLabel: '대길', badgeColor: 'green' as const },
        ],
    } as SuriAnalysisData,

    elementalBalance: {
        elements: { wood: 2, fire: 1, earth: 3, metal: 2, water: 2 },
        nameElements: ['metal', 'fire', 'fire'] as ('wood' | 'fire' | 'earth' | 'metal' | 'water')[],
    } as ElementalBalanceData,

    unluckyCharacters: {
        firstName: { hanja: '詩', readingTitle: '시', reading: '시', badgeLabel: '양호', badgeColor: 'green' as const },
        secondName: { hanja: '朗', readingTitle: '랑', reading: '랑', badgeLabel: '양호', badgeColor: 'green' as const },
    } as UnluckyCharactersData,

    headerData: {
        fiveElementsTheory: {
            reportOverview: "'음' 기운이 강하지만 '양'의 기운도 적절히 조화되어 있어서 안정감을 주는 이름이에요. 내면의 평화를 유지하며 조화로운 삶을 살아갈 수 있음을 의미해요.",
            categoryGuide: '* 음양오행은 글자 획수의 짝수(음)와 홀수(양)를 적절히 섞어 기운의 균형을 맞추는 거에요.',
        },
        pronunciationElements: {
            reportOverview: '발음오행은 이름의 소리가 가진 오행 속성을 분석해요. 시(詩)는 수(水), 랑(朗)은 화(火)로 상생 관계를 이루어 조화로운 이름이에요.',
            categoryGuide: '* 발음오행은 이름을 소리 내어 불렀을 때, 소리의 기운끼리 서로 돕는지 싸우는지 볼 때 사용해요.',
        },
        suriAnalysis: {
            reportOverview: '수리성명학으로 분석한 결과, 초년/중년/말년 운이 모두 길하여 전반적으로 좋은 운세를 가진 이름이에요.',
            categoryGuide: '* 수리성명학은 한자의 획수를 더한 숫자로 초년, 청년, 중년, 말년의 구체적인 운세를 계산하는 거에요.',
        },
        elementalBalance: {
            reportOverview: '자원오행은 한자가 가진 본래의 오행 속성을 분석해요. 금(金), 화(火) 기운이 조화롭게 배치되어 있어요.',
            categoryGuide: '* 자원오행은 한자가 본래 가지고 있는 자연의 성질(불, 물, 나무 등)이 사주에 필요한 기운인지 보는 거에요.',
        },
        unluckyCharacters: {
            reportOverview: '이름에 사용된 한자들은 모두 양호한 문자로, 불용문자에 해당하지 않아요. 안심하고 사용해도 좋은 이름이에요.',
            categoryGuide: '* 불용문자는 뜻은 좋아도 이름에 쓰면 운이 나빠진다고 하여 작명 시 피하는 글자인지 확인하는거에요.',
        },
    } as { [key in ContentType]?: { reportOverview?: string; categoryGuide?: string } },
};

// =============================================================================
// Constants
// =============================================================================
const MEANING_CARD_WIDTH = 354;
const MEANING_CARD_GAP = 8;

// =============================================================================
// Component
// =============================================================================
export const ReportScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { width: screenWidth } = useWindowDimensions();

    const [meaningCardIndex, setMeaningCardIndex] = useState(0);
    const [llmReport, setLlmReport] = useState<NameReport | null>(null);

    const meaningCarouselRef = useRef<FlatList>(null);

    const report = DUMMY_REPORT;

    // 전역 사주 정보 훅
    const { sajuInfo: globalSajuInfo, updateSaju } = useNameGeneration();

    // Route params에서 이름 데이터 및 사주 정보 가져오기
    const route = useRoute<RouteProp<{
        NameReport: {
            nameData?: { hanjaName: string };
            saju?: { birthDate?: string; birthTime?: string | null };
        }
    }, 'NameReport'>>();
    const nameData = route.params?.nameData;
    const routeSaju = route.params?.saju;

    // 사주 정보: 전역 상태 우선, 없으면 route params 사용
    const effectiveSajuInfo = globalSajuInfo
        ? { birthDate: globalSajuInfo.birthDate.toISOString(), birthTime: globalSajuInfo.birthTime ?? null }
        : routeSaju?.birthDate
            ? { birthDate: routeSaju.birthDate, birthTime: routeSaju.birthTime ?? null }
            : null;

    const [sajuLoading, setSajuLoading] = useState(false);
    const [sajuError, setSajuError] = useState(false);

    // 사주 정보 입력 여부 확인 (birthDate가 있어야 사주 정보가 있는 것)
    const hasSaju = Boolean(effectiveSajuInfo?.birthDate);

    // 사주정보 입력하기 버튼 핸들러
    const handleSajuInputPress = useCallback(() => {
        (navigation as any).navigate('BirthDateModal', {
            onComplete: async (result: { birthDate: Date; birthTime?: string }) => {
                // 1. 전역 사주 정보 업데이트
                updateSaju({
                    birthDate: result.birthDate,
                    birthTime: result.birthTime,
                });

                setSajuLoading(true);
                setSajuError(false);

                // 2. route params도 업데이트 (화면 재진입 시 유지)
                const newSaju = {
                    birthDate: result.birthDate.toISOString(),
                    birthTime: result.birthTime ?? null,
                };
                (navigation as any).setParams({ saju: newSaju });

                // 3. 현재 카드 LLM 리포트 재생성 (즉시 UI 업데이트)
                if (nameData?.hanjaName) {
                    try {
                        const newReport = await namingService.regenerateReportWithSaju(
                            nameData.hanjaName,
                            { birthDate: result.birthDate, birthTime: result.birthTime }
                        );
                        setLlmReport(newReport);
                        console.log('[ReportScreen] Current report regenerated with new saju');
                    } catch (error) {
                        console.error('[ReportScreen] Current report regeneration failed:', error);
                        setSajuError(true);
                    } finally {
                        setSajuLoading(false);
                    }
                } else {
                    setSajuLoading(false);
                }

                // 4. 백그라운드에서 나머지 모든 리포트 병렬 재생성 (다른 카드 즉시 로딩 가능)
                namingService.regenerateAllReportsWithSaju({
                    birthDate: result.birthDate,
                    birthTime: result.birthTime,
                }).then(count => {
                    console.log(`[ReportScreen] Background regeneration complete: ${count} reports`);
                }).catch(error => {
                    console.error('[ReportScreen] Background regeneration failed:', error);
                });
            },
        });
    }, [navigation, nameData?.hanjaName, updateSaju]);

    // 사주 분석 재시도 핸들러
    const handleSajuRetry = useCallback(async () => {
        if (!effectiveSajuInfo?.birthDate || !nameData?.hanjaName) return;

        setSajuLoading(true);
        setSajuError(false);

        try {
            const newReport = await namingService.regenerateReportWithSaju(
                nameData.hanjaName,
                {
                    birthDate: new Date(effectiveSajuInfo.birthDate),
                    birthTime: effectiveSajuInfo.birthTime ?? undefined,
                }
            );
            setLlmReport(newReport);
            console.log('[ReportScreen] LLM report regenerated on retry');
        } catch (error) {
            console.error('[ReportScreen] LLM retry failed:', error);
            setSajuError(true);
        } finally {
            setSajuLoading(false);
        }
    }, [effectiveSajuInfo, nameData?.hanjaName]);

    // LLM 리포트 로딩 (캐시에서 또는 사주 정보로 재생성)
    useEffect(() => {
        if (!nameData?.hanjaName) return;

        const loadReport = async () => {
            const cachedReport = namingService.getReport(nameData.hanjaName);

            // 전역 사주가 있고, 캐시된 리포트에 사주 정보가 없으면 재생성
            const hasCachedSaju = cachedReport?.analysis?.naturalElement?.sajuElements;
            if (effectiveSajuInfo?.birthDate && cachedReport && !hasCachedSaju) {
                console.log('[ReportScreen] Regenerating report with global saju for:', nameData.hanjaName);
                setSajuLoading(true);
                try {
                    const newReport = await namingService.regenerateReportWithSaju(
                        nameData.hanjaName,
                        {
                            birthDate: new Date(effectiveSajuInfo.birthDate),
                            birthTime: effectiveSajuInfo.birthTime ?? undefined,
                        }
                    );
                    setLlmReport(newReport);
                    console.log('[ReportScreen] Report regenerated with global saju');
                } catch (error) {
                    console.error('[ReportScreen] Report regeneration failed:', error);
                    setLlmReport(cachedReport); // 실패 시 기존 리포트 사용
                } finally {
                    setSajuLoading(false);
                }
            } else if (cachedReport) {
                console.log('[ReportScreen] Using cached LLM report for:', nameData.hanjaName);
                setLlmReport(cachedReport);
            }
        };

        loadReport();
    }, [nameData?.hanjaName, effectiveSajuInfo?.birthDate]);

    // LLM analysisComments → headerData 변환
    const headerData = llmReport?.analysis ? {
        fiveElementsTheory: {
            reportOverview: llmReport.analysis.yinYang?.summary || DUMMY_ORTHODOX_DATA.headerData.fiveElementsTheory?.reportOverview,
            categoryGuide: DUMMY_ORTHODOX_DATA.headerData.fiveElementsTheory?.categoryGuide,
        },
        pronunciationElements: {
            reportOverview: llmReport.analysis.pronunciation?.summary || DUMMY_ORTHODOX_DATA.headerData.pronunciationElements?.reportOverview,
            categoryGuide: DUMMY_ORTHODOX_DATA.headerData.pronunciationElements?.categoryGuide,
        },
        suriAnalysis: {
            reportOverview: llmReport.analysis.numerology?.summary || DUMMY_ORTHODOX_DATA.headerData.suriAnalysis?.reportOverview,
            categoryGuide: DUMMY_ORTHODOX_DATA.headerData.suriAnalysis?.categoryGuide,
        },
        elementalBalance: {
            reportOverview: llmReport.analysis.naturalElement?.summary || DUMMY_ORTHODOX_DATA.headerData.elementalBalance?.reportOverview,
            categoryGuide: DUMMY_ORTHODOX_DATA.headerData.elementalBalance?.categoryGuide,
        },
        unluckyCharacters: {
            reportOverview: llmReport.analysis.forbiddenChar?.summary || DUMMY_ORTHODOX_DATA.headerData.unluckyCharacters?.reportOverview,
            categoryGuide: DUMMY_ORTHODOX_DATA.headerData.unluckyCharacters?.categoryGuide,
        },
    } : DUMMY_ORTHODOX_DATA.headerData;

    // 동적 elementalBalance 데이터 (llmReport.analysis.naturalElement에서)
    // sajuElements는 퍼센트(0-100), 사주는 최대 8개 오행 → 12.5% per element
    // 그래프는 3칸, 개수 3 이상은 꽉찬(3/3)으로 표시
    const percentToCount = (pct: number): 0 | 1 | 2 | 3 => {
        const count = Math.round(pct / 12.5);  // 퍼센트 → 개수 역산
        return Math.min(3, Math.max(0, count)) as 0 | 1 | 2 | 3;  // 3 이상은 3으로
    };
    const dynamicElementalBalance = llmReport?.analysis?.naturalElement ? {
        elements: {
            wood: percentToCount(llmReport.analysis.naturalElement.sajuElements?.wood || 0),
            fire: percentToCount(llmReport.analysis.naturalElement.sajuElements?.fire || 0),
            earth: percentToCount(llmReport.analysis.naturalElement.sajuElements?.earth || 0),
            metal: percentToCount(llmReport.analysis.naturalElement.sajuElements?.metal || 0),
            water: percentToCount(llmReport.analysis.naturalElement.sajuElements?.water || 0),
        },
        nameElements: (llmReport.analysis.naturalElement.filledElements || []).map(
            (e: string) => e.toLowerCase() as 'wood' | 'fire' | 'earth' | 'metal' | 'water'
        ),
    } : DUMMY_ORTHODOX_DATA.elementalBalance;

    // DEBUG: 자원오행 데이터 확인
    console.log('[ReportScreen] llmReport.naturalElement.sajuElements:', llmReport?.analysis?.naturalElement?.sajuElements);
    console.log('[ReportScreen] dynamicElementalBalance:', dynamicElementalBalance);

    // 동적 suriAnalysis 데이터 (llmReport.analysis.numerology에서)
    // level → badgeLabel/badgeColor 매핑
    const levelToBadge = (level: string): { badgeLabel: string; badgeColor: 'green' | 'red' | 'orange' } => {
        switch (level) {
            case '대길':
                return { badgeLabel: '대길', badgeColor: 'green' };
            case '길':
                return { badgeLabel: '길', badgeColor: 'green' };
            case '반길반흉':
                return { badgeLabel: '반길반흉', badgeColor: 'orange' };
            case '흉':
                return { badgeLabel: '흉', badgeColor: 'red' };
            default:
                return { badgeLabel: level, badgeColor: 'green' };
        }
    };

    // numerology 데이터: scores 또는 periods 키 사용
    const numerologyData = (llmReport?.analysis?.numerology as any)?.scores
        || (llmReport?.analysis?.numerology as any)?.periods;

    const dynamicSuriAnalysis: SuriAnalysisData = numerologyData
        ? {
            periods: numerologyData.map((score: {
                name: string;
                level: string;
                ageRange: string;
                suriNumber: number;
                interpretation: string;
            }) => ({
                label: score.name,  // 초년, 청년, 중년, 말년
                detail: `${score.ageRange} | ${score.suriNumber}수`,
                description: score.interpretation,
                ...levelToBadge(score.level),
            })),
        }
        : DUMMY_ORTHODOX_DATA.suriAnalysis;



    // 동적 fiveElementsTheory 데이터 (llmReport.analysis.yinYang에서)
    // YinYangCharacter: { hanja, meaning, strokes, isOdd, type } → FiveElementsTheoryData
    const dynamicFiveElementsTheory = (() => {
        const chars = llmReport?.analysis?.yinYang?.characters;
        if (!chars || chars.length < 2) return DUMMY_ORTHODOX_DATA.fiveElementsTheory;

        const mapChar = (c: { hanja: string; meaning: string; strokes: number; isOdd: boolean; type: '음' | '양' }) => {
            const parts = c.meaning.split(' ');
            const hun = parts.slice(0, -1).join(' ') || c.meaning; // 마지막 단어 제외 = 훈
            const reading = parts[parts.length - 1] || c.hanja;    // 마지막 단어 = 음
            return {
                hanja: c.hanja,
                reading,  // 음 (예: '임')
                hun,      // 훈 (예: '수풀')
                strokeCount: c.strokes,
                isEven: !c.isOdd,
                yinYang: (c.type === '양' ? 'yang' : 'yin') as 'yin' | 'yang',
            };
        };

        return {
            surname: mapChar(chars[0]),
            firstName: mapChar(chars[1]),
            secondName: chars[2] ? mapChar(chars[2]) : undefined,
        };
    })();

    // 동적 unluckyCharacters 데이터 (llmReport.analysis.forbiddenChar에서)
    // status → badgeLabel/badgeColor 매핑
    const statusToBadge = (status: string): { badgeLabel: string; badgeColor: 'green' | 'orange' | 'red' } => {
        switch (status) {
            case 'good':
                return { badgeLabel: '좋음', badgeColor: 'green' };
            case 'caution':
                return { badgeLabel: '주의', badgeColor: 'orange' };
            case 'forbidden':
                return { badgeLabel: '비추천', badgeColor: 'red' };
            default:
                return { badgeLabel: '좋음', badgeColor: 'green' };
        }
    };

    const dynamicUnluckyCharacters: UnluckyCharactersData | null = (() => {
        const chars = (llmReport?.analysis?.forbiddenChar as any)?.characters;
        if (!chars || chars.length < 1) return null;

        const mapChar = (c: { hanja: string; hangul: string; meaning: string; status: string }) => ({
            hanja: c.hanja,
            readingTitle: c.meaning,  // 훈 (예: 펼)
            reading: c.hangul,        // 음 (예: 서)
            ...statusToBadge(c.status),
        });

        return {
            firstName: mapChar(chars[0]),
            secondName: chars[1] ? mapChar(chars[1]) : undefined,
        };
    })();

    // 동적 pronunciationElements 데이터 (llmReport.analysis.pronunciation에서)
    const dynamicPronunciationElements: PronunciationElementsData | null = (() => {
        const chars = (llmReport?.analysis?.pronunciation as any)?.characters;
        if (!chars || chars.length < 2) return null;  // 최소 성씨 + 이름1

        const mapChar = (c: { hanja: string; hangul: string; meaning: string }) => ({
            hanja: c.hanja,
            reading: c.hangul,  // 음 (김, 시, 랑)
            hun: c.meaning,     // 훈 (쇠, 시, 밝을)
        });

        return {
            surname: mapChar(chars[0]),
            firstName: mapChar(chars[1]),
            secondName: chars[2] ? mapChar(chars[2]) : undefined,
        };
    })();

    // 동적 meaningCards 데이터
    // 카드1: 캐러셀의 한자별 의미 (llmReport.carousel[0].characters)
    // 카드2: LLM 이름 해석 (llmReport.nameInterpretations)
    const dynamicMeaningCards: MeaningCard[] | null = (() => {
        const carousel = llmReport?.carousel;
        const interpretations = (llmReport as any)?.nameInterpretations;

        // 캐러셀에서 한자별 의미 카드 (type: 'meaning')
        const meaningCarouselCard = carousel?.find((c: any) => c.type === 'meaning');
        if (!meaningCarouselCard?.characters || meaningCarouselCard.characters.length < 1) return null;

        // 카드1: 한자별 의미
        const card1: MeaningCard = {
            items: meaningCarouselCard.characters.map((c: { hanja: string; meaning: string; story: string }) => ({
                title: `${c.hanja}: ${c.meaning}`,
                description: c.story,
            })),
        };

        // 카드2: 이름 해석 (LLM에서 생성)
        const card2: MeaningCard = interpretations ? {
            items: [
                { title: interpretations.interpretation1?.title || '', description: interpretations.interpretation1?.description || '' },
                { title: interpretations.interpretation2?.title || '', description: interpretations.interpretation2?.description || '' },
            ],
        } : DUMMY_REPORT.meaningCards[1];  // fallback

        return [card1, card2];
    })();

    // 동적 headerCharacters 데이터 (상단 한자/훈/음)
    const dynamicHeaderCharacters: NameCharacter[] | null = (() => {
        const chars = llmReport?.analysis?.pronunciation?.characters;
        if (!chars || chars.length < 2) return null;

        // 성씨 제외, 이름 두 자만 표시 (chars[1], chars[2])
        return chars.slice(1).map((c: { hanja: string; hangul: string; meaning: string }) => ({
            hanja: c.hanja,
            pronunciation: c.hangul,  // 음 (시, 랑)
            meaning: c.meaning,       // 훈 (시, 밝을)
            strokes: 0,               // 더미 (사용하지 않음)
            yinYang: '양' as const,   // 더미
        }));
    })();

    const handleGoBack = () => {
        navigation.goBack();
    };

    const handleShare = () => {
        console.log('Share report');
    };

    const handleGoHome = () => {
        (navigation as any).popToTop();
    };

    // Meaning card carousel viewability
    const onMeaningViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].index !== null) {
            setMeaningCardIndex(viewableItems[0].index);
        }
    }, []);

    const meaningViewabilityConfig = {
        itemVisiblePercentThreshold: 50,
    };

    // =============================================================================
    // Render Functions
    // =============================================================================

    // Letter Card (한자 + 훈/음)
    const renderLetterCard = (char: NameCharacter, size: 'large' | 'medium' = 'large') => (
        <View style={styles.letterCard} key={char.hanja}>
            <Text style={size === 'large' ? styles.hanjaLarge : styles.hanjaMedium}>
                {char.hanja}
            </Text>
            <View style={styles.textWrapper}>
                <Text style={styles.meaningText}>{char.meaning}</Text>
                <Text style={styles.pronunciationText}>{char.pronunciation}</Text>
            </View>
        </View>
    );

    // Meaning Card - first card has 2 meanings (gap:24), others have 1 (gap:8)
    const renderMeaningCard = ({ item, index }: { item: MeaningCard; index: number }) => (
        <View style={[styles.meaningCard, { width: MEANING_CARD_WIDTH }]}>
            <View style={[
                styles.meaningCardContent,
                item.items.length > 1 ? { gap: 24 } : { gap: 8 }
            ]}>
                {item.items.map((meaning, idx) => (
                    <View style={styles.meaningTextWrapper} key={idx}>
                        <Text style={styles.meaningCardTitle}>{meaning.title}</Text>
                        <Text style={styles.meaningCardDesc}>{meaning.description}</Text>
                    </View>
                ))}
            </View>
        </View>
    );

    // Name Vibe Item
    const renderNameVibeItem = (item: NameVibeItem, index: number) => (
        <View style={styles.nameVibeItem} key={index}>
            <Text style={styles.nameVibeTitle}>{item.title}</Text>
            <Text style={styles.nameVibeDesc}>{item.description}</Text>
        </View>
    );



    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Topbar */}
            <Topbar
                location="page"
                title="이름 풀이"
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
                        onPress={handleGoBack}
                    />
                }
                trailingItems={
                    <TopbarItem
                        status="label"
                        label="공유하기"
                        labelColor="#0052C7"
                        onPress={handleShare}
                    />
                }
            />

            {/* Scrollable Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 32 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* ================================================================= */}
                {/* Report Overview Section */}
                {/* ================================================================= */}
                <View style={styles.reportOverview}>
                    {/* Name Overview Card */}
                    <View style={styles.nameOverview}>
                        <View style={styles.marginWrapper}>
                            {/* Name with Hanja */}
                            <View style={styles.nameWrapper}>
                                {(dynamicHeaderCharacters || report.characters).map((char) => renderLetterCard(char, 'large'))}
                            </View>

                            {/* Summary Text */}
                            <Text style={styles.summaryText}>{llmReport?.summary?.text || report.summary}</Text>
                        </View>
                    </View>

                    {/* Meaning Card Carousel */}
                    <View style={styles.paginationWrapper}>
                        <FlatList
                            ref={meaningCarouselRef}
                            data={dynamicMeaningCards || report.meaningCards}
                            renderItem={renderMeaningCard}
                            keyExtractor={(_, index) => index.toString()}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            snapToInterval={MEANING_CARD_WIDTH + MEANING_CARD_GAP}
                            decelerationRate="fast"
                            contentContainerStyle={styles.carouselContent}
                            ItemSeparatorComponent={() => <View style={{ width: MEANING_CARD_GAP }} />}
                            onViewableItemsChanged={onMeaningViewableItemsChanged}
                            viewabilityConfig={meaningViewabilityConfig}
                            style={styles.carouselFlatList}
                        />

                        {/* Pagination - using design system component */}
                        <Pagination
                            totalPages={(dynamicMeaningCards || report.meaningCards).length}
                            currentPage={meaningCardIndex}
                            style={styles.carouselPagination}
                        />
                    </View>
                </View>

                {/* ================================================================= */}
                {/* Report Details Section */}
                {/* ================================================================= */}
                <View style={styles.reportDetails}>
                    {/* Orthodox Report - using design system component */}
                    <View style={styles.orthodoxReportWrapper}>
                        <Text style={styles.sectionTitle}>성명학적 풀이</Text>
                        <OrthodoxReport
                            pronunciationElements={dynamicPronunciationElements || DUMMY_ORTHODOX_DATA.pronunciationElements}
                            fiveElementsTheory={dynamicFiveElementsTheory}
                            suriAnalysis={dynamicSuriAnalysis}
                            elementalBalance={dynamicElementalBalance}
                            unluckyCharacters={dynamicUnluckyCharacters || DUMMY_ORTHODOX_DATA.unluckyCharacters}
                            hasSaju={hasSaju}
                            headerData={headerData}
                            onSajuInputPress={handleSajuInputPress}
                            sajuLoading={sajuLoading}
                            sajuError={sajuError}
                            onSajuRetry={handleSajuRetry}
                        />
                    </View>

                    {/* Name Vibes */}
                    <View style={styles.nameVibesWrapper}>
                        <Text style={styles.sectionTitle}>이름의 느낌</Text>
                        <View style={styles.nameVibesList}>
                            {report.nameVibes.map((item, index) => renderNameVibeItem(item, index))}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

// =============================================================================
// Styles
// =============================================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.default.highest,
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: space[400],
        gap: 48, // space[1200]
    },

    // =========================================================================
    // Report Overview
    // =========================================================================
    reportOverview: {
        gap: 20, // Figma: gap:20
    },
    nameOverview: {
        // NO backgroundColor - Figma has no bg fill
        borderRadius: 0, // Figma: no border radius
    },
    marginWrapper: {
        paddingHorizontal: 16, // Figma: p:(24,16,24,16) = horizontal 16
        paddingVertical: 24, // Figma: vertical 24
        gap: 20, // Figma: gap:20
        alignItems: 'center',
    },
    nameWrapper: {
        flexDirection: 'row',
        gap: 24, // Figma: gap:24
    },
    letterCard: {
        alignItems: 'center',
        gap: 4, // Figma: gap:4
    },
    hanjaLarge: {
        fontFamily: 'Pretendard-Bold',
        fontSize: 41, // Figma: 41px
        fontWeight: '700',
        lineHeight: 48, // Figma: 48lh
        color: colors.text.default.primary, // Figma: rgb(51,44,33)
    },
    hanjaMedium: {
        fontFamily: 'Pretendard-Bold',
        fontSize: 26, // Figma: 26px
        fontWeight: '700',
        lineHeight: 32, // Figma: 32lh
        color: colors.text.default.primary, // Figma: rgb(51,44,33)
    },
    textWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4, // Figma: gap:4
    },
    meaningText: {
        fontFamily: 'Pretendard-SemiBold',
        fontSize: 14, // Figma: 14px
        fontWeight: '600',
        lineHeight: 16, // Figma: 16lh
        color: colors.text.default.secondary, // Figma: rgb(146,132,109)
    },
    pronunciationText: {
        fontFamily: 'Pretendard-Bold',
        fontSize: 14, // Figma: 14px
        fontWeight: '700',
        lineHeight: 18, // Figma: 18lh
        color: colors.text.default.primary, // Figma: rgb(51,44,33)
    },
    summaryText: {
        fontFamily: 'Pretendard-Medium',
        fontSize: 14, // Figma: 14px
        fontWeight: '500',
        lineHeight: 18, // Figma: 18lh
        color: colors.text.default.primary, // Figma: rgb(51,44,33) - NOT secondary!
        textAlign: 'center',
    },

    // =========================================================================
    // Meaning Card Carousel
    // =========================================================================
    paginationWrapper: {
        gap: 8, // Figma: gap between carousel and dots
    },
    carouselFlatList: {
        marginHorizontal: -16, // Extend to screen edges
        paddingHorizontal: 0,
    },
    carouselContent: {
        paddingHorizontal: 16, // Add padding to prevent card clipping
    },
    carouselPagination: {
        paddingHorizontal: 0,
        paddingBottom: 0,
    },
    meaningCard: {
        // NO backgroundColor - Figma has no bg fill
        borderRadius: 16, // Figma: r:16
        padding: 16, // Figma: p:16
        borderWidth: 1, // Figma: strokeWeight:1
        borderColor: '#D8CBB2', // Figma: stroke:rgb(216,203,178)
    },
    meaningCardContent: {
        gap: 24, // Figma: first 2 cards gap:24
    },
    meaningCardContentSmall: {
        gap: 8, // Figma: cards 3+ gap:8
    },
    meaningTextWrapper: {
        gap: 8, // Figma: gap:8 between title and desc
    },
    meaningCardTitle: {
        fontFamily: 'Pretendard-SemiBold',
        fontSize: 14, // Figma: 14px
        fontWeight: '600',
        lineHeight: 16, // Figma: 16lh
        color: colors.text.default.primary, // Figma: rgb(51,44,33)
    },
    meaningCardDesc: {
        fontFamily: 'Pretendard-Medium',
        fontSize: 14, // Figma: 14px
        fontWeight: '500',
        lineHeight: 18, // Figma: 18lh
        color: colors.text.default.secondary, // Figma: rgb(146,132,109)
    },
    paginationDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 4, // Figma: small gap between dots
    },
    paginationDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.primitives.sand[300],
    },
    paginationDotActive: {
        width: 16,
        backgroundColor: colors.primitives.sand[500],
    },

    // =========================================================================
    // Report Details
    // =========================================================================
    reportDetails: {
        gap: 48, // Figma: gap:48
    },
    sectionTitle: {
        fontFamily: 'Pretendard-Bold',
        fontSize: 14, // Figma: 14px
        fontWeight: '700',
        lineHeight: 18, // Figma: 18lh
        color: colors.text.default.primary, // Figma: rgb(51,44,33)
    },

    // =========================================================================
    // Orthodox Report
    // =========================================================================
    orthodoxReportWrapper: {
        gap: 12, // Figma: gap:12
    },
    tabMenuScroll: {
        marginHorizontal: -16, // Extend to edges
    },
    tabMenuContent: {
        paddingHorizontal: 16,
        gap: 8, // Figma: gap between tabs
    },
    tabItem: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: colors.primitives.sand[100],
        borderRadius: 8,
    },
    tabItemActive: {
        backgroundColor: colors.primitives.sand[800],
    },
    tabLabel: {
        fontFamily: 'Pretendard-SemiBold',
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 18,
        color: colors.text.default.secondary,
    },
    tabLabelActive: {
        color: colors.primitives.sand[50],
    },
    orthodoxContent: {
        gap: 16, // Figma: marginWrapper gap:16
    },
    orthodoxHeader: {
        backgroundColor: colors.primitives.sand[200], // Figma: bg:rgb(244,236,221)
        borderRadius: 16, // Figma: r:16
        padding: 8, // Figma: p:8
        gap: 8, // Figma: gap:8
    },
    orthodoxSummaryBox: {
        backgroundColor: colors.primitives.sand[300], // Figma: reportOverview bg:rgb(232,222,200)
        borderRadius: 12, // Figma: r:12
        padding: 12, // Figma: p:12
    },
    orthodoxHeaderText: {
        fontFamily: 'Pretendard-Medium',
        fontSize: 14, // Figma: 14px
        fontWeight: '500',
        lineHeight: 18, // Figma: 18lh
        color: colors.text.default.primary, // Figma: rgb(51,44,33)
    },
    orthodoxCharBreakdown: {
        gap: 0, // rows have no gap between them
    },
    orthodoxRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    orthodoxLetterCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    suriInfo: {
        alignItems: 'flex-end',
        gap: 4, // Figma: gap:4
    },
    suriText: {
        fontFamily: 'Pretendard-SemiBold',
        fontSize: 14, // Figma: 14px
        fontWeight: '600',
        lineHeight: 16, // Figma: 16lh
        color: colors.text.default.secondary, // Figma: rgb(146,132,109)
    },
    yinYangText: {
        fontFamily: 'Pretendard-SemiBold',
        fontSize: 14, // Figma: 14px
        fontWeight: '600',
        lineHeight: 18, // Figma: 18lh
        color: colors.text.default.primary, // Figma: rgb(51,44,33)
    },
    categoryGuide: {
        paddingHorizontal: 8, // Figma: p:(4,8,4,8)
        paddingVertical: 4,
    },
    categoryGuideText: {
        fontFamily: 'Pretendard-Medium',
        fontSize: 11,
        fontWeight: '500',
        color: colors.text.default.tertiary,
    },

    // =========================================================================
    // Name Vibes
    // =========================================================================
    nameVibesWrapper: {
        gap: 12, // Figma: gap:12
    },
    nameVibesList: {
        gap: 4, // Figma: gap:4
    },
    nameVibeItem: {
        backgroundColor: colors.primitives.sand[100], // Figma: bg:rgb(244,236,221) = #F4ECDD = sand[100]
        borderRadius: 16, // Figma: r:16
        padding: 12, // Figma: p:12
        gap: 8, // Figma: gap:8
    },
    nameVibeTitle: {
        fontFamily: 'Pretendard-SemiBold',
        fontSize: 14, // Figma: 14px
        fontWeight: '600',
        lineHeight: 16, // Figma: 16lh
        color: colors.text.default.primary, // Figma: rgb(51,44,33)
    },
    nameVibeDesc: {
        fontFamily: 'Pretendard-Medium',
        fontSize: 14, // Figma: 14px
        fontWeight: '500',
        lineHeight: 18, // Figma: 18lh
        color: colors.text.default.secondary, // Figma: rgb(146,132,109)
    },
});

export default ReportScreen;
