

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

interface RevealStepProps {
    name: NameResult;
    surname: string;
    storyKeyword: string;
    vibeKeyword: string;
    vibeEmoji: string;
    hasSaju?: boolean;
    onViewMore: () => void;
    onViewReport?: () => void;
    onRestart: () => void;
}

export function RevealStep({
    name,
    storyKeyword,
    vibeKeyword,
    vibeEmoji,
    hasSaju,
    onViewMore,
    onViewReport,
    onRestart
}: RevealStepProps) {
    const fullName = name.fullName.hangul;
    const hanjaChars = name.hanja1 && name.hanja2
        ? `${name.hanja1.hanja}${name.hanja2.hanja}`
        : '';

    const copy = storyKeyword && vibeKeyword
        ? `${storyKeyword}로 찾아와, ${vibeKeyword}처럼 자라날 아이`
        : '특별한 의미를 담은 이름';

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 text-white p-8">
            <div className="w-full max-w-md">
                {/* Result card */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-700 relative overflow-hidden">
                    {/* Background emoji */}
                    <div className="absolute top-4 right-4 text-6xl opacity-20">
                        {vibeEmoji}
                    </div>

                    {/* Warning if any */}
                    {name.warning && (
                        <div className="absolute top-4 left-4 bg-amber-500/20 text-amber-400 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                            <span>⚠️</span>
                            <span>주의</span>
                        </div>
                    )}

                    {/* Name display */}
                    <div className="text-center py-8">
                        <div className="text-5xl font-light tracking-widest mb-4">
                            {fullName}
                        </div>
                        {hanjaChars && (
                            <div className="text-2xl text-slate-400 tracking-widest mb-2">
                                {hanjaChars}
                            </div>
                        )}
                        {name.romanName && (
                            <div className="text-sm text-slate-500 uppercase tracking-wider">
                                {name.romanName}
                            </div>
                        )}
                    </div>

                    {/* Story copy */}
                    <div className="text-center text-slate-300 text-sm leading-relaxed mb-6">
                        "{copy}"
                    </div>

                    {/* Element tags */}
                    <div className="flex justify-center gap-2 flex-wrap">
                        {name.elements.map((el, i) => (
                            <span
                                key={i}
                                className="px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-400"
                            >
                                {el}
                            </span>
                        ))}
                    </div>

                    {/* Score */}
                    <div className="text-center mt-6">
                        <span className="text-4xl font-light">{name.score}</span>
                        <span className="text-slate-500 text-sm ml-1">점</span>
                    </div>

                    {/* Hanja meanings */}
                    {name.hanja1 && name.hanja2 && (
                        <div className="mt-6 pt-6 border-t border-slate-700/50">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <div className="text-2xl mb-1">{name.hanja1.hanja}</div>
                                    <div className="text-xs text-slate-400">{name.hanja1.meaning_korean}</div>
                                </div>
                                <div>
                                    <div className="text-2xl mb-1">{name.hanja2.hanja}</div>
                                    <div className="text-xs text-slate-400">{name.hanja2.meaning_korean}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                <div className="mt-8 space-y-3">
                    <button
                        onClick={onViewMore}
                        className="
              w-full py-4 
              bg-white text-slate-900 
              rounded-full 
              font-medium text-lg
              hover:bg-slate-100 
              transition-all duration-300
            "
                    >
                        더 많은 이름 보기
                    </button>
                    {hasSaju && onViewReport && (
                        <button
                            onClick={onViewReport}
                            className="
                w-full py-3 
                bg-amber-500/20 text-amber-400 
                rounded-full 
                font-medium
                hover:bg-amber-500/30 
                transition-colors
                flex items-center justify-center gap-2
              "
                        >
                            <span>✨</span>
                            <span>사주 분석 리포트 보기</span>
                        </button>
                    )}
                    <button
                        onClick={onRestart}
                        className="
              w-full py-3 
              bg-transparent text-slate-400 
              rounded-full 
              font-medium
              hover:text-white 
              transition-colors
            "
                    >
                        처음부터 다시 하기
                    </button>
                </div>
            </div>
        </div>
    );
}
