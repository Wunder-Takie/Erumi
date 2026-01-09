import { useState, useCallback } from 'react';
import { IntroStep, BasicsStep, StoryStep, VibeStep, LoadingStep, RevealStep, SajuStep } from './steps';
import { NameReport } from './NameReport';
import { generateNames } from '../utils/namingUtils';
import { calculateSaju, sajuToWeights, analyzeElements, extractYongsin } from '../utils/sajuUtils';
import storyFlow from '../data/story_flow.json';

type Step = 'intro' | 'basics' | 'saju' | 'story' | 'vibe' | 'loading' | 'reveal' | 'list';

interface StoryOption {
    id: string;
    emoji: string;
    label: string;
    description: string;
    elements: { [key: string]: number };
    storyKeyword: string;
}

interface VibeOption {
    id: string;
    emoji: string;
    label: string;
    description: string;
    elements: { [key: string]: number };
    vibeKeyword: string;
}

// Name result from generateNames
interface NameResult {
    fullName: { hangul: string; hanja?: string };
    hanjaName?: string;
    hanja1?: { hanja: string; meaning_korean: string };
    hanja2?: { hanja: string; meaning_korean: string };
    elements: string[];
    score: number;
    warning?: { reason: string };
    romanName?: string;
}

// Saju-related data (flexible to match JS utils)
interface SajuData {
    birthDate: string;
    birthHour: number | null;
    saju: Record<string, unknown>;
    analysis: Record<string, unknown>;
    weights: Record<string, number>;
}

interface UserSelections {
    surname: string;
    gender: 'M' | 'F' | null;
    story: StoryOption | null;
    vibe: VibeOption | null;
    saju: SajuData | null;
}

export function StoryApp() {
    const [step, setStep] = useState<Step>('intro');
    const [selections, setSelections] = useState<UserSelections>({
        surname: '',
        gender: null,
        story: null,
        vibe: null,
        saju: null
    });
    const [results, setResults] = useState<NameResult[]>([]);
    const [topResult, setTopResult] = useState<NameResult | null>(null);
    const [showReport, setShowReport] = useState(false);
    const [selectedName, setSelectedName] = useState<NameResult | null>(null);

    // Calculate element weights from selections
    const calculateWeights = useCallback(() => {
        const weights = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };

        // 🆕 Saju contribution (40% if available)
        if (selections.saju) {
            const sajuWeights = selections.saju.weights;
            for (const [element, value] of Object.entries(sajuWeights)) {
                weights[element as keyof typeof weights] += (value as number) * 0.4;
            }
        }

        // Story contribution (30% if saju, else 50%)
        const storyMultiplier = selections.saju ? 0.3 : 0.5;
        if (selections.story && Object.keys(selections.story.elements).length > 0) {
            for (const [element, ratio] of Object.entries(selections.story.elements)) {
                weights[element as keyof typeof weights] += 20 * (ratio as number) * storyMultiplier / 0.5;
            }
        }

        // Vibe contribution (30% if saju, else 50%)
        const vibeMultiplier = selections.saju ? 0.3 : 0.5;
        if (selections.vibe) {
            for (const [element, ratio] of Object.entries(selections.vibe.elements)) {
                weights[element as keyof typeof weights] += 20 * (ratio as number) * vibeMultiplier / 0.5;
            }
        }

        return weights;
    }, [selections.story, selections.vibe, selections.saju]);

    // Handle name generation
    const handleGenerate = useCallback(() => {
        const storyWeights = calculateWeights();

        // 🆕 용신 가중치 계산 (Option A: 강화된 가중치, 완전 차단 X)
        let yongsinWeights: Record<string, number> | null = null;
        if (selections.saju) {
            const yongsinData = extractYongsin(selections.saju.saju);
            yongsinWeights = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };

            // 용신: +40점 (가장 필요한 오행)
            for (const el of yongsinData.yongsin) {
                yongsinWeights[el as keyof typeof yongsinWeights] += 40;
            }
            // 희신: +20점 (용신을 돕는 오행)
            for (const el of yongsinData.huisin) {
                yongsinWeights[el as keyof typeof yongsinWeights] += 20;
            }
            // 기신: -20점 (피해야 할 오행)
            for (const el of yongsinData.gisin) {
                yongsinWeights[el as keyof typeof yongsinWeights] -= 20;
            }

            console.log('🎯 용신 분석:', yongsinData.summary);
            console.log('🎯 용신 가중치:', yongsinWeights);
        }

        const names = generateNames(
            selections.surname,
            [],
            selections.gender,
            storyWeights,
            yongsinWeights  // 🆕 용신 가중치 전달
        );

        setResults(names);
        setTopResult(names[0]);
        setStep('reveal');
    }, [selections, calculateWeights]);

    // Step handlers
    const handleBasicsComplete = (surname: string, gender: 'M' | 'F' | null) => {
        setSelections(prev => ({ ...prev, surname, gender }));
        setStep('saju'); // 🆕 Go to saju step
    };

    const handleSajuComplete = (birthDate: string, birthHour: number | null) => {
        const saju = (calculateSaju as (date: string, hour: number | null) => Record<string, unknown>)(birthDate, birthHour);
        const analysis = analyzeElements(saju);
        const weights = sajuToWeights(saju);

        setSelections(prev => ({
            ...prev,
            saju: { birthDate, birthHour, saju, analysis, weights }
        }));
        setStep('story');
    };

    const handleSajuSkip = () => {
        setSelections(prev => ({ ...prev, saju: null }));
        setStep('story');
    };

    const handleStoryComplete = (story: StoryOption) => {
        setSelections(prev => ({ ...prev, story }));
        setStep('vibe');
    };

    const handleVibeComplete = (vibe: VibeOption) => {
        setSelections(prev => ({ ...prev, vibe }));
        setStep('loading');
    };

    const handleRestart = () => {
        setSelections({ surname: '', gender: null, story: null, vibe: null, saju: null });
        setResults([]);
        setTopResult(null);
        setStep('intro');
    };

    // Render current step
    const renderStep = () => {
        switch (step) {
            case 'intro':
                return <IntroStep onStart={() => setStep('basics')} />;

            case 'basics':
                return <BasicsStep onNext={handleBasicsComplete} />;

            case 'saju':
                return (
                    <SajuStep
                        onNext={handleSajuComplete}
                        onSkip={handleSajuSkip}
                    />
                );

            case 'story':
                return (
                    <StoryStep
                        options={storyFlow.story.options as StoryOption[]}
                        question={storyFlow.story.question}
                        subtitle={storyFlow.story.subtitle}
                        onNext={handleStoryComplete}
                    />
                );

            case 'vibe':
                return (
                    <VibeStep
                        options={(storyFlow.vibe.options as unknown) as VibeOption[]}
                        question={storyFlow.vibe.question}
                        subtitle={storyFlow.vibe.subtitle}
                        onNext={handleVibeComplete}
                    />
                );

            case 'loading':
                return (
                    <LoadingStep
                        storyKeyword={selections.story?.storyKeyword || ''}
                        vibeKeyword={selections.vibe?.vibeKeyword || ''}
                        onComplete={handleGenerate}
                    />
                );

            case 'reveal':
                return topResult ? (
                    <>
                        <RevealStep
                            name={topResult}
                            surname={selections.surname}
                            storyKeyword={selections.story?.storyKeyword || ''}
                            vibeKeyword={selections.vibe?.vibeKeyword || ''}
                            vibeEmoji={selections.vibe?.emoji || '✨'}
                            hasSaju={!!selections.saju}
                            onViewMore={() => setStep('list')}
                            onViewReport={() => setShowReport(true)}
                            onRestart={handleRestart}
                        />
                        {showReport && topResult && (
                            <NameReport
                                name={topResult as Parameters<typeof NameReport>[0]['name']}
                                saju={selections.saju?.saju as Parameters<typeof NameReport>[0]['saju']}
                                analysis={selections.saju?.analysis as Parameters<typeof NameReport>[0]['analysis']}
                                onClose={() => setShowReport(false)}
                            />
                        )}
                    </>
                ) : null;

            case 'list':
                return (
                    <>
                        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-8">
                            <div className="max-w-2xl mx-auto">
                                <button
                                    onClick={() => setStep('reveal')}
                                    className="text-slate-400 hover:text-white mb-6 flex items-center gap-2"
                                >
                                    ← 돌아가기
                                </button>

                                <h2 className="text-2xl font-light mb-6">추천 이름 목록</h2>
                                <p className="text-sm text-slate-400 mb-4">이름을 클릭하여 상세 정보를 확인하세요</p>

                                <div className="space-y-3">
                                    {results.slice(0, 100).map((name, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedName(name)}
                                            className="bg-slate-800/50 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className="text-slate-500 w-6">{idx + 1}</span>
                                                <div>
                                                    <div className="text-lg font-medium">{name.fullName.hangul}</div>
                                                    <div className="text-sm text-slate-400">
                                                        {name.hanja1?.hanja}{name.hanja2?.hanja} • {name.elements.join(' + ')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {name.warning && <span className="text-amber-400">⚠️</span>}
                                                <span className="text-xl">{name.score}점</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleRestart}
                                    className="w-full mt-8 py-3 text-slate-400 hover:text-white"
                                >
                                    처음부터 다시 하기
                                </button>
                            </div>
                        </div>
                        {selectedName && (
                            <NameReport
                                name={selectedName as Parameters<typeof NameReport>[0]['name']}
                                saju={selections.saju?.saju as Parameters<typeof NameReport>[0]['saju']}
                                analysis={selections.saju?.analysis as Parameters<typeof NameReport>[0]['analysis']}
                                onClose={() => setSelectedName(null)}
                            />
                        )}
                    </>
                );

            default:
                return null;
        }
    };

    return <>{renderStep()}</>;
}
