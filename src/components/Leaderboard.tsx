import { type Score } from "../lib/fire";

interface Props {
    scores: Score[];
}

export default function Leaderboard({ scores }: Props) {
    const top = [...scores].sort((a, b) => b.wpm - a.wpm).slice(0, 5);

    return (
        <div className="w-full">
            <span className="mb-3 block text-xs font-medium uppercase tracking-wider text-[#6F6A5F]">top racers</span>
            {top.length === 0 ? (
                <p className="border-t border-[#2C2A27] py-4 text-xs text-[#6F6A5F]">no races yet</p>
            ) : (
                <ul>
                    {top.map((score, i) => (
                        <li key={score.name} className="flex items-center gap-4 border-t border-[#2C2A27] py-2.5 last:border-b">
                            <span className={"w-4 text-xs " + (i === 0 ? "text-[#D6FF3D]" : "text-[#6F6A5F]")} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                {i + 1}
                            </span>
                            <span className="flex-1 truncate text-sm text-[#F2EEE6]">{score.name}</span>
                            <span className="text-sm text-[#F2EEE6]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{score.wpm}wpm</span>
                            <span className="text-xs text-[#6F6A5F]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{score.accuracy}%</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}