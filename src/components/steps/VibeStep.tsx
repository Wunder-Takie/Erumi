import { useState } from 'react';

interface VibeOption {
    id: string;
    emoji: string;
    label: string;
    description: string;
    elements: Record<string, number>;
    vibeKeyword: string;
}

interface VibeStepProps {
    options: VibeOption[];
    question: string;
    subtitle: string;
    onNext: (selected: VibeOption) => void;
}

export function VibeStep({ options, question, subtitle, onNext }: VibeStepProps) {
    const [selected, setSelected] = useState<VibeOption | null>(null);

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white p-8">
            {/* Header */}
            <div className="text-center mb-6 pt-8">
                <span className="text-slate-500 text-sm">Step 3 of 4</span>
                <h2 className="text-2xl font-light mt-4 mb-2">{question}</h2>
                <p className="text-slate-400 text-sm">{subtitle}</p>
            </div>

            {/* Options grid - 2 columns */}
            <div className="flex-1 max-w-2xl mx-auto w-full overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                    {options.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => setSelected(option)}
                            className={`
                p-4 rounded-2xl text-center
                transition-all duration-200
                ${selected?.id === option.id
                                    ? 'bg-white text-slate-900 scale-[1.02]'
                                    : 'bg-slate-800/50 hover:bg-slate-700/50'
                                }
              `}
                        >
                            <div className="text-4xl mb-2">{option.emoji}</div>
                            <div className={`font-medium text-sm ${selected?.id === option.id ? 'text-slate-900' : 'text-white'}`}>
                                {option.label}
                            </div>
                            <div className={`text-xs mt-1 ${selected?.id === option.id ? 'text-slate-600' : 'text-slate-400'}`}>
                                {option.description}
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
                    이름 생성하기
                </button>
            </div>
        </div>
    );
}
