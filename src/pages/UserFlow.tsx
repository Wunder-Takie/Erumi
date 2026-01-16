/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect, useCallback } from 'react';
import { generateNames } from '../utils/namingUtils';
import { calculateSaju, sajuToWeights, analyzeElements, extractYongsin } from '../utils/sajuUtils';
import storyFlow from '../data/story_flow.json';
import type { NameItem } from '../types';
import { NameReport } from '../components/NameReport';

// Types
interface StoryOption {
    id: string;
    emoji: string;
    label: string;
    description: string;
    elements: Record<string, number>;
    storyKeyword: string;
}

interface VibeOption {
    id: string;
    emoji: string;
    label: string;
    description: string;
    elements: Record<string, number>;
    vibeKeyword: string;
}

type Step = 'intro' | 'basics' | 'saju' | 'story' | 'vibe' | 'result';

// 테마 정의
const BATCH_THEMES = [
    { id: 'yongsin', emoji: '🔥', title: '용신 최적 이름', description: '사주에 가장 잘 맞는' },
    { id: 'balance', emoji: '⚖️', title: '오행 균형 이름', description: '오행이 고르게 분포된' },
    { id: 'suri', emoji: '🔢', title: '수리 운세 이름', description: '획수 조합이 좋은' },
    { id: 'story', emoji: '📖', title: '스토리 매칭 이름', description: '선택한 스토리와 어울리는' },
    { id: 'total', emoji: '✨', title: '종합 추천 이름', description: '모든 요소가 조화로운' },
];

// 결제 패키지 생성 함수 (잠금된 개수에 따라 동적 생성)
function getPaymentPackages(remainingCount: number) {
    const packages = [
        { count: 1, price: 1900, label: '1개', popular: false },
        { count: 3, price: 3900, label: '3개', popular: false },
    ];

    // 전체 패키지 추가 (잠금된 개수에 따라 4개 또는 5개)
    if (remainingCount >= 4) {
        packages.push({
            count: remainingCount,
            price: remainingCount === 5 ? 5900 : 4900,
            label: `전체 (${remainingCount}개)`,
            popular: true,
        });
    }

    return packages.filter(pkg => pkg.count <= remainingCount);
}

// 오행 이모지
const ELEMENT_EMOJI: Record<string, string> = {
    Wood: '🌳', Fire: '🔥', Earth: '🏔️', Metal: '⚔️', Water: '💧',
};

// 오행 한글
const ELEMENT_KO: Record<string, string> = {
    Wood: '목(木)', Fire: '화(火)', Earth: '토(土)', Metal: '금(金)', Water: '수(水)',
};

// Progress Bar Component
function ProgressBar({ currentStep }: { currentStep: Step }) {
    const steps: { key: Step; label: string }[] = [
        { key: 'basics', label: '기본정보' },
        { key: 'saju', label: '사주' },
        { key: 'story', label: '스토리' },
        { key: 'vibe', label: '바이브' },
        { key: 'result', label: '결과' },
    ];

    const currentIndex = steps.findIndex(s => s.key === currentStep);
    if (currentStep === 'intro') return null;

    return (
        <div className="w-full max-w-md mx-auto mb-8">
            <div className="flex justify-between items-center">
                {steps.map((step, idx) => (
                    <div key={step.key} className="flex flex-col items-center flex-1">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${idx <= currentIndex
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-200 text-gray-400'
                                }`}
                        >
                            {idx + 1}
                        </div>
                        <span className={`text-xs mt-1 ${idx <= currentIndex ? 'text-indigo-600' : 'text-gray-400'}`}>
                            {step.label}
                        </span>
                    </div>
                ))}
            </div>
            <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
                    title={`진행률: ${currentIndex + 1}/${steps.length}`}
                />
            </div>
        </div>
    );
}

// 힌트 생성 함수
function generateHint(name: NameItem): string {
    const hangulName = 'hanjaName' in name ? name.fullName.hangul : String(name.fullName);
    const charCount = hangulName.length;
    const elements = 'elements' in name ? name.elements : [];
    const mainElement = elements?.[0] || 'Wood';
    const elementKo = ELEMENT_KO[mainElement] || mainElement;

    // 느낌 키워드 (점수 기반)
    let vibe = '조화로운';
    if (name.score >= 95) vibe = '빛나는';
    else if (name.score >= 90) vibe = '밝은';
    else if (name.score >= 85) vibe = '따뜻한';
    else if (name.score >= 80) vibe = '부드러운';

    return `${charCount}글자 · ${elementKo} · ${vibe} 느낌`;
}

// 잠금된 이름 카드 (힌트 표시)
function LockedNameCard({
    hint,
    onUnlock,
    isFreeAvailable,
    onFreeUnlock
}: {
    hint: string;
    onUnlock: () => void;
    isFreeAvailable?: boolean;
    onFreeUnlock?: () => void;
}) {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 backdrop-blur-sm bg-white/80 z-10 flex flex-col items-center justify-center">
                <div className="text-4xl mb-4">🔒</div>
                <div className="text-sm text-gray-500 mb-4">{hint}</div>
                {isFreeAvailable ? (
                    <button
                        onClick={onFreeUnlock}
                        className="bg-green-500 text-white px-6 py-3 rounded-full font-bold hover:bg-green-600 transition-colors shadow-lg"
                    >
                        🎁 무료로 열기
                    </button>
                ) : (
                    <button
                        onClick={onUnlock}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-full font-medium hover:bg-indigo-700 transition-colors"
                    >
                        잠금 해제하기
                    </button>
                )}
            </div>
            <div className="text-6xl font-bold text-gray-300 blur-md mb-2">김**</div>
            <div className="text-2xl text-gray-300 blur-md mb-4">金**</div>
            <div className="text-5xl font-bold text-gray-300 blur-md">??점</div>
        </div>
    );
}

// 결제 모달
function PaymentModal({
    remainingCount,
    onSelectPackage,
    onClose,
}: {
    remainingCount: number;
    onSelectPackage: (count: number) => void;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    ✕
                </button>

                <h3 className="text-xl font-bold text-center mb-2">이름 잠금 해제</h3>
                <p className="text-gray-500 text-center text-sm mb-6">
                    이 묶음에서 {remainingCount}개의 이름이 잠겨있어요
                </p>

                <div className="space-y-3">
                    {getPaymentPackages(remainingCount).map((pkg) => {
                        const perPrice = Math.round(pkg.price / pkg.count);

                        return (
                            <button
                                key={pkg.count}
                                onClick={() => onSelectPackage(pkg.count)}
                                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${pkg.popular
                                    ? 'border-indigo-600 bg-indigo-50'
                                    : 'border-gray-200 hover:border-indigo-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-left">
                                        <div className="font-bold text-lg">
                                            {pkg.label}
                                            {pkg.popular && (
                                                <span className="ml-2 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                                                    BEST
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            개당 {perPrice.toLocaleString()}원
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-indigo-600">
                                        {pkg.price.toLocaleString()}원
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <p className="text-xs text-gray-400 text-center mt-4">
                    구매 시 상세 리포트 + PDF 저장 포함
                </p>
            </div>
        </div>
    );
}

// 이름 카드 (열람 가능)
function UnlockedNameCard({
    name,
    onViewReport,
    isFree,
}: {
    name: NameItem;
    onViewReport: () => void;
    isFree?: boolean;
}) {
    const hangulName = 'hanjaName' in name ? name.fullName.hangul : String(name.fullName);
    const hanjaName = 'hanjaName' in name ? name.hanjaName : '';

    return (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center relative">
            {isFree && (
                <div className="absolute top-4 left-4 text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">
                    🎁 무료 열람
                </div>
            )}
            <div className="text-5xl font-bold text-gray-900 mb-2">{hangulName}</div>
            {hanjaName && <div className="text-2xl text-gray-500 mb-4">{hanjaName}</div>}
            <div
                className={`text-5xl font-bold mb-4 ${name.score >= 90
                    ? 'text-indigo-600'
                    : name.score >= 80
                        ? 'text-green-600'
                        : name.score >= 70
                            ? 'text-yellow-600'
                            : 'text-gray-600'
                    }`}
            >
                {name.score}점
            </div>
            {'elements' in name && (
                <div className="flex justify-center gap-2 mb-4">
                    {name.elements.map((el: string) => (
                        <span key={el} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                            {ELEMENT_EMOJI[el] || ''} {ELEMENT_KO[el] || el}
                        </span>
                    ))}
                </div>
            )}
            <button
                onClick={onViewReport}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
                📊 상세 리포트 보기
            </button>
        </div>
    );
}

// Main UserFlow Component
export default function UserFlow() {
    const [step, setStep] = useState<Step>('intro');
    const [surname, setSurname] = useState('');
    const [gender, setGender] = useState<'M' | 'F' | null>(null);
    const [selectedStory, setSelectedStory] = useState<StoryOption | null>(null);
    const [selectedVibe, setSelectedVibe] = useState<VibeOption | null>(null);
    const [allNames, setAllNames] = useState<NameItem[]>([]); // 전체 이름 풀
    const [loading, setLoading] = useState(false);
    const [selectedReportName, setSelectedReportName] = useState<NameItem | null>(null);

    // 사주
    const [birthDate, setBirthDate] = useState('');
    const [birthHour, setBirthHour] = useState<number | null>(null);
    const [computedSaju, setComputedSaju] = useState<Record<string, unknown> | null>(null);
    const [computedAnalysis, setComputedAnalysis] = useState<{
        distribution: Record<string, number>;
        neededElements: string[];
        excessElements: string[];
    } | null>(null);

    // 5개 묶음 시스템
    const [currentBatch, setCurrentBatch] = useState<NameItem[]>([]);
    const [unlockedIndices, setUnlockedIndices] = useState<Set<number>>(new Set()); // 모두 잠금 상태로 시작
    const [usedNames, setUsedNames] = useState<Set<string>>(new Set()); // 이미 본 이름들
    const [batchIndex, setBatchIndex] = useState(0); // 테마 순환용
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [hasFreeChance, setHasFreeChance] = useState(true); // 무료 열람 기회 (전체 1회)
    const [freeUnlockedKey, setFreeUnlockedKey] = useState<string | null>(null); // 무료로 열린 이름 키

    const hourOptions = [
        { value: null, label: '모름 / 건너뛰기' },
        { value: 0, label: '자시 (23:30~01:30)' },
        { value: 1, label: '축시 (01:30~03:30)' },
        { value: 2, label: '인시 (03:30~05:30)' },
        { value: 3, label: '묘시 (05:30~07:30)' },
        { value: 4, label: '진시 (07:30~09:30)' },
        { value: 5, label: '사시 (09:30~11:30)' },
        { value: 6, label: '오시 (11:30~13:30)' },
        { value: 7, label: '미시 (13:30~15:30)' },
        { value: 8, label: '신시 (15:30~17:30)' },
        { value: 9, label: '유시 (17:30~19:30)' },
        { value: 10, label: '술시 (19:30~21:30)' },
        { value: 11, label: '해시 (21:30~23:30)' },
    ];

    // 현재 테마
    const currentTheme = BATCH_THEMES[batchIndex % BATCH_THEMES.length];

    // 5개 묶음 생성 함수
    const generateBatch = useCallback((names: NameItem[], usedSet: Set<string>): NameItem[] => {
        // 아직 안 본 이름들 필터링
        const availableNames = names.filter(n => {
            const key = 'hanjaName' in n ? n.hanjaName : String(n.fullName);
            return !usedSet.has(key);
        });

        if (availableNames.length === 0) return [];

        // 상위 20개에서 랜덤으로 5개 추출
        const topPool = availableNames.slice(0, Math.min(20, availableNames.length));
        const shuffled = [...topPool].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 5);
    }, []);

    const generateNameResults = async () => {
        setLoading(true);
        try {
            const storyWeights: Record<string, number> = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };
            let yongsinWeights: Record<string, number> | null = null;

            const useSaju = !!birthDate;

            if (useSaju) {
                const saju = await (calculateSaju as (date: string, hour: number | null) => Promise<Record<string, unknown>>)(birthDate, birthHour);
                const analysis = analyzeElements(saju);
                const weights = sajuToWeights(saju);

                setComputedSaju(saju);
                setComputedAnalysis(analysis as any);

                for (const [element, value] of Object.entries(weights)) {
                    storyWeights[element as keyof typeof storyWeights] += (value as number) * 0.4;
                }

                const yongsinData = extractYongsin(saju);
                yongsinWeights = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };
                for (const el of yongsinData.yongsin) {
                    yongsinWeights[el as keyof typeof yongsinWeights] += 40;
                }
                for (const el of yongsinData.huisin) {
                    yongsinWeights[el as keyof typeof yongsinWeights] += 20;
                }
                for (const el of yongsinData.gisin) {
                    yongsinWeights[el as keyof typeof yongsinWeights] -= 20;
                }
            } else {
                setComputedSaju(null);
                setComputedAnalysis(null);
            }

            const storyMultiplier = useSaju ? 0.3 : 0.5;
            if (selectedStory && Object.keys(selectedStory.elements).length > 0) {
                for (const [element, ratio] of Object.entries(selectedStory.elements)) {
                    storyWeights[element as keyof typeof storyWeights] += 20 * (ratio as number) * storyMultiplier / 0.5;
                }
            }

            const vibeMultiplier = useSaju ? 0.3 : 0.5;
            if (selectedVibe) {
                for (const [element, ratio] of Object.entries(selectedVibe.elements)) {
                    storyWeights[element as keyof typeof storyWeights] += 20 * (ratio as number) * vibeMultiplier / 0.5;
                }
            }

            const names = await generateNames(surname, [], gender, storyWeights, yongsinWeights) as NameItem[];
            const sortedNames = [...names].sort((a, b) => b.score - a.score);
            setAllNames(sortedNames);

            // 첫 묶음 생성
            const firstBatch = generateBatch(sortedNames, new Set());
            setCurrentBatch(firstBatch);
            setUnlockedIndices(new Set()); // 모두 잠금 상태
            setHasFreeChance(true); // 무료 기회 1번
            setUsedNames(new Set());
            setBatchIndex(0);
        } catch (err) {
            console.error('Error generating names:', err);
        } finally {
            setLoading(false);
        }
    };

    // 새 묶음 로드
    const loadNextBatch = () => {
        // 현재 묶음의 이름들을 used에 추가
        const newUsed = new Set(usedNames);
        currentBatch.forEach(n => {
            const key = 'hanjaName' in n ? n.hanjaName : String(n.fullName);
            newUsed.add(key);
        });
        setUsedNames(newUsed);

        // 새 묶음 생성
        const newBatch = generateBatch(allNames, newUsed);
        if (newBatch.length > 0) {
            setCurrentBatch(newBatch);
            setUnlockedIndices(new Set()); // 모두 잠금 상태
            // hasFreeChance는 리셋하지 않음 - 전체 과정 중 1회만 무료
            setBatchIndex(prev => prev + 1);
        }
    };

    // 무료로 카드 열기
    const handleFreeUnlock = (index: number) => {
        if (!hasFreeChance) return;
        const name = currentBatch[index];
        const key = 'hanjaName' in name ? name.hanjaName : String(name.fullName);
        setFreeUnlockedKey(key); // 무료로 열린 이름 기록
        setUnlockedIndices(new Set([index]));
        setHasFreeChance(false);
    };

    const goNext = () => {
        if (step === 'intro') setStep('basics');
        else if (step === 'basics' && surname) setStep('saju');
        else if (step === 'saju') setStep('story');
        else if (step === 'story') setStep('vibe');
        else if (step === 'vibe') {
            generateNameResults();
            setStep('result');
        }
    };

    const goBack = () => {
        if (step === 'basics') setStep('intro');
        else if (step === 'saju') setStep('basics');
        else if (step === 'story') setStep('saju');
        else if (step === 'vibe') setStep('story');
        else if (step === 'result') setStep('vibe');
    };

    // 결제 시뮬레이션
    const handlePayment = (count: number) => {
        const newUnlocked = new Set(unlockedIndices);

        // 잠긴 것 중에서 count개 해제
        let unlockCount = 0;
        for (let i = 0; i < currentBatch.length && unlockCount < count; i++) {
            if (!newUnlocked.has(i)) {
                newUnlocked.add(i);
                unlockCount++;
            }
        }

        setUnlockedIndices(newUnlocked);
        setShowPaymentModal(false);
    };

    // 남은 잠금 개수
    const remainingLocked = useMemo(() => {
        return currentBatch.length - unlockedIndices.size;
    }, [currentBatch.length, unlockedIndices.size]);

    // 전부 열람했는지
    const allUnlocked = useMemo(() => {
        return currentBatch.length > 0 && unlockedIndices.size >= currentBatch.length;
    }, [currentBatch.length, unlockedIndices.size]);

    // 더 불러올 이름이 있는지
    const hasMoreNames = useMemo(() => {
        const newUsed = new Set(usedNames);
        currentBatch.forEach(n => {
            const key = 'hanjaName' in n ? n.hanjaName : String(n.fullName);
            newUsed.add(key);
        });
        return allNames.some(n => {
            const key = 'hanjaName' in n ? n.hanjaName : String(n.fullName);
            return !newUsed.has(key);
        });
    }, [allNames, usedNames, currentBatch]);

    // ESC로 모달 닫기
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (selectedReportName) setSelectedReportName(null);
                if (showPaymentModal) setShowPaymentModal(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [selectedReportName, showPaymentModal]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="max-w-lg mx-auto px-4 py-8">
                {/* Progress Bar */}
                <ProgressBar currentStep={step} />

                {/* Step: Intro */}
                {step === 'intro' && (
                    <div className="text-center py-16">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            ✨ 아이의 첫 번째 이름
                        </h1>
                        <p className="text-lg text-gray-600 mb-12">
                            이름은 평생을 함께할 첫 번째 선물입니다
                        </p>
                        <button
                            onClick={goNext}
                            className="bg-indigo-600 text-white px-12 py-4 rounded-full text-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg"
                        >
                            시작하기
                        </button>
                    </div>
                )}

                {/* Step: Basics */}
                {step === 'basics' && (
                    <div className="py-8">
                        <button onClick={goBack} className="text-gray-500 hover:text-gray-700 mb-4">
                            ← 이전
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">기본 정보</h2>
                        <p className="text-gray-600 mb-8">아이의 성씨와 성별을 알려주세요</p>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">성씨</label>
                                <input
                                    type="text"
                                    value={surname}
                                    onChange={(e) => setSurname(e.target.value)}
                                    placeholder="예: 김"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">성별</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: 'M' as const, label: '👦 남아' },
                                        { value: 'F' as const, label: '👧 여아' },
                                        { value: null, label: '✨ 아직 몰라요' },
                                    ].map((option) => (
                                        <button
                                            key={option.label}
                                            onClick={() => setGender(option.value)}
                                            className={`py-3 rounded-xl font-medium transition-all ${gender === option.value
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={goNext}
                            disabled={!surname}
                            className="w-full mt-8 bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            다음 →
                        </button>
                    </div>
                )}

                {/* Step: Saju */}
                {step === 'saju' && (
                    <div className="py-8">
                        <button onClick={goBack} className="text-gray-500 hover:text-gray-700 mb-4">
                            ← 이전
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">📅 사주 정보</h2>
                        <p className="text-gray-600 mb-8">사주를 입력하면 더 정확한 이름을 추천해드려요</p>

                        <div className="space-y-6">
                            <div>
                                <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">생년월일</label>
                                <input
                                    id="birthDate"
                                    type="date"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    title="생년월일 선택"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                                />
                            </div>

                            <div>
                                <label htmlFor="birthHour" className="block text-sm font-medium text-gray-700 mb-2">태어난 시간</label>
                                <select
                                    id="birthHour"
                                    value={birthHour ?? ''}
                                    onChange={(e) => setBirthHour(e.target.value === '' ? null : Number(e.target.value))}
                                    title="태어난 시간 선택"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                                >
                                    {hourOptions.map((opt) => (
                                        <option key={opt.label} value={opt.value ?? ''}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-8 space-y-3">
                            <button
                                onClick={goNext}
                                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                            >
                                다음 →
                            </button>
                            {!birthDate && (
                                <button
                                    onClick={goNext}
                                    className="w-full text-gray-500 hover:text-gray-700 py-2"
                                >
                                    건너뛰기
                                </button>
                            )}
                        </div>

                        {birthDate && (
                            <p className="text-center text-sm text-indigo-600 mt-4">
                                ✓ 사주가 이름 추천에 반영됩니다
                            </p>
                        )}
                    </div>
                )}

                {/* Step: Story */}
                {step === 'story' && (
                    <div className="py-8">
                        <button onClick={goBack} className="text-gray-500 hover:text-gray-700 mb-4">
                            ← 이전
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {storyFlow.story.question}
                        </h2>
                        <p className="text-gray-600 mb-8">{storyFlow.story.subtitle}</p>

                        <div className="grid grid-cols-2 gap-3">
                            {(storyFlow.story.options as StoryOption[]).map((story) => (
                                <button
                                    key={story.id}
                                    onClick={() => setSelectedStory(selectedStory?.id === story.id ? null : story)}
                                    className={`p-4 rounded-xl text-left transition-all ${selectedStory?.id === story.id
                                        ? 'bg-indigo-600 text-white shadow-lg scale-[1.02]'
                                        : 'bg-white text-gray-900 hover:bg-gray-50 shadow'
                                        }`}
                                >
                                    <div className="text-2xl mb-2">{story.emoji}</div>
                                    <div className="font-medium text-sm">{story.label}</div>
                                    <div className={`text-xs mt-1 ${selectedStory?.id === story.id ? 'text-indigo-200' : 'text-gray-400'}`}>
                                        {story.description}
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={goNext}
                            className="w-full mt-8 bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                        >
                            다음 →
                        </button>
                    </div>
                )}

                {/* Step: Vibe */}
                {step === 'vibe' && (
                    <div className="py-8">
                        <button onClick={goBack} className="text-gray-500 hover:text-gray-700 mb-4">
                            ← 이전
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {storyFlow.vibe.question}
                        </h2>
                        <p className="text-gray-600 mb-8">{storyFlow.vibe.subtitle}</p>

                        <div className="grid grid-cols-2 gap-3">
                            {((storyFlow.vibe.options as unknown) as VibeOption[]).map((vibe) => (
                                <button
                                    key={vibe.id}
                                    onClick={() => setSelectedVibe(selectedVibe?.id === vibe.id ? null : vibe)}
                                    className={`p-4 rounded-xl text-left transition-all ${selectedVibe?.id === vibe.id
                                        ? 'bg-purple-600 text-white shadow-lg scale-[1.02]'
                                        : 'bg-white text-gray-900 hover:bg-gray-50 shadow'
                                        }`}
                                >
                                    <div className="text-2xl mb-2">{vibe.emoji}</div>
                                    <div className="font-medium text-sm">{vibe.label}</div>
                                    <div className={`text-xs mt-1 ${selectedVibe?.id === vibe.id ? 'text-purple-200' : 'text-gray-400'}`}>
                                        {vibe.description}
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={goNext}
                            disabled={loading}
                            className="w-full mt-8 bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
                        >
                            {loading ? '이름 찾는 중...' : '이름 추천받기 ✨'}
                        </button>
                    </div>
                )}

                {/* Step: Result */}
                {step === 'result' && (
                    <div className="py-8">
                        <button onClick={goBack} className="text-gray-500 hover:text-gray-700 mb-4">
                            ← 다시 선택하기
                        </button>

                        {/* 테마 헤더 */}
                        <div className="text-center mb-8">
                            <div className="text-4xl mb-2">{currentTheme.emoji}</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                {currentTheme.title}
                            </h2>
                            <p className="text-gray-500 text-sm">
                                {currentTheme.description}
                            </p>
                        </div>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
                                <p className="text-gray-500">이름을 찾고 있습니다...</p>
                            </div>
                        ) : (
                            <>
                                {/* 5개 카드 한번에 표시 */}
                                <div className="space-y-4 mb-6">
                                    {currentBatch.map((name, idx) => (
                                        <div key={idx}>
                                            {unlockedIndices.has(idx) ? (
                                                <UnlockedNameCard
                                                    name={name}
                                                    isFree={('hanjaName' in name ? name.hanjaName : String(name.fullName)) === freeUnlockedKey}
                                                    onViewReport={() => setSelectedReportName(name)}
                                                />
                                            ) : (
                                                <LockedNameCard
                                                    hint={generateHint(name)}
                                                    onUnlock={() => setShowPaymentModal(true)}
                                                    isFreeAvailable={hasFreeChance}
                                                    onFreeUnlock={() => handleFreeUnlock(idx)}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* 새 묶음 버튼 (전부 열람 시) */}
                                {allUnlocked && hasMoreNames && (
                                    <button
                                        onClick={loadNextBatch}
                                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg mb-4"
                                    >
                                        ✨ 새로운 이름 묶음 보기
                                    </button>
                                )}

                                {allUnlocked && !hasMoreNames && (
                                    <div className="text-center text-gray-500 mb-4 py-4">
                                        모든 추천 이름을 확인했습니다 🎉
                                    </div>
                                )}

                                {/* 다시하기 */}
                                <button
                                    onClick={() => {
                                        setStep('intro');
                                        setSurname('');
                                        setGender(null);
                                        setSelectedStory(null);
                                        setSelectedVibe(null);
                                        setAllNames([]);
                                        setCurrentBatch([]);
                                        setBirthDate('');
                                        setBirthHour(null);
                                        setComputedSaju(null);
                                        setComputedAnalysis(null);
                                        setUnlockedIndices(new Set());
                                        setUsedNames(new Set());
                                        setBatchIndex(0);
                                        setHasFreeChance(true);
                                    }}
                                    className="w-full py-3 text-gray-500 hover:text-gray-700"
                                >
                                    처음부터 다시 하기
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Payment Modal */}
                {showPaymentModal && (
                    <PaymentModal
                        remainingCount={remainingLocked}
                        onSelectPackage={handlePayment}
                        onClose={() => setShowPaymentModal(false)}
                    />
                )}

                {/* Name Report Modal */}
                {selectedReportName && 'hanjaName' in selectedReportName && (
                    <NameReport
                        name={{
                            hangulName: selectedReportName.hanja1.hangul + selectedReportName.hanja2.hangul,
                            hanjaName: selectedReportName.hanja1.hanja + selectedReportName.hanja2.hanja,
                            fullName: {
                                hangul: selectedReportName.fullName.hangul,
                                hanja: surname + selectedReportName.hanja1.hanja + selectedReportName.hanja2.hanja,
                                roman: selectedReportName.romanName,
                            },
                            hanja1: {
                                hanja: selectedReportName.hanja1.hanja,
                                hangul: selectedReportName.hanja1.hangul,
                                meaning_korean: (selectedReportName.hanja1 as any).meaning_korean || '',
                                element: (selectedReportName.hanja1 as any).element || 'Wood',
                                strokes: (selectedReportName.hanja1 as any).strokes || 8,
                            },
                            hanja2: {
                                hanja: selectedReportName.hanja2.hanja,
                                hangul: selectedReportName.hanja2.hangul,
                                meaning_korean: (selectedReportName.hanja2 as any).meaning_korean || '',
                                element: (selectedReportName.hanja2 as any).element || 'Water',
                                strokes: (selectedReportName.hanja2 as any).strokes || 8,
                            },
                            suri: selectedReportName.suri as any || {
                                초년운: { count: 0, info: { level: '-' } },
                                중년운: { count: 0, info: { level: '-' } },
                                말년운: { count: 0, info: { level: '-' } },
                                총운: { count: 0, info: { level: '-' } },
                            },
                            elements: selectedReportName.elements,
                            score: selectedReportName.score,
                        }}
                        saju={computedSaju as any}
                        analysis={computedAnalysis as any}
                        onClose={() => setSelectedReportName(null)}
                    />
                )}
            </div>
        </div>
    );
}
