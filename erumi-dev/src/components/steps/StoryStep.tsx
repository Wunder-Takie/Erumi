import { useState } from 'react';

interface StoryOption {
    id: string;
    emoji: string;
    label: string;
    description: string;
    elements: Record<string, number>;
    storyKeyword: string;
}

interface StoryStepProps {
    options: StoryOption[];
    question: string;
    subtitle: string;
    onNext: (selected: StoryOption) => void;
}

export function StoryStep({ options, question, subtitle, onNext }: StoryStepProps) {
    const [selected, setSelected] = useState<StoryOption | null>(null);

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white p-8">
            {/* Header */}
            <div className="text-center mb-8 pt-8">
                <span className="text-slate-500 text-sm">Step 2 of 4</span>
                <h2 className="text-2xl font-light mt-4 mb-2">{question}</h2>
                <p className="text-slate-400 text-sm">{subtitle}</p>
            </div>

            {/* Options grid */}
            <div className="flex-1 max-w-lg mx-auto w-full overflow-y-auto">
                <div className="grid gap-3">
                    {options.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => setSelected(option)}
                            className={`
                p-4 rounded-2xl text-left
                transition-all duration-200
                ${selected?.id === option.id
                                    ? 'bg-white text-slate-900 scale-[1.02]'
                                    : 'bg-slate-800/50 hover:bg-slate-700/50'
                                }
              `}
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-3xl">{option.emoji}</span>
                                <div>
                                    <div className={`font-medium ${selected?.id === option.id ? 'text-slate-900' : 'text-white'}`}>
                                        {option.label}
                                    </div>
                                    <div className={`text-sm ${selected?.id === option.id ? 'text-slate-600' : 'text-slate-400'}`}>
                                        {option.description}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Next button */}
            <div className="pt-6 pb-4 max-w-lg mx-auto w-full">
                <button
                    onClick={() => selected && onNext(selected)}
                    disabled={!selected}
                    className="
            w-full py-4 
            bg-white text-slate-900 
            rounded-full 
            font-medium text-lg
            hover:bg-slate-100 
            transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
          "
                >
                    다음
                </button>
            </div>
        </div>
    );
}
