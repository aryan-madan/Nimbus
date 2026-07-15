import { type Score } from "../lib/fire";

interface Props {
    scores: Score[];
}

export default function Leaderboard({ scores }: Props) {
    return (
        <div className="overflow-hidden rounded-2xl border border-[#2C2A27] bg-[#1B1918]">
            <div className="grid grid-cols-[2rem_1fr_3.5rem_3.5rem_3.5rem] gap-2 border-b border-[#2C2A27] px-4 py-3 text-[10px] font-medium uppercase tracking-wide text-[#6F6A5F]">
                <span>#</span>
                <span>name</span>
                <span className="text-right">wpm</span>
                <span className="text-right">races</span>
                <span className="text-right">acc</span>
            </div>
            {scores.map((score, i) => (
                <div key={i} className="grid grid-cols-[2rem_1fr_3.5rem_3.5rem_3.5rem] gap-2 border-b border-[#2C2A27] px-4 py-3 text-sm text-[#F2EEE6] last:border-b-0">
                    <span className="text-[#6F6A5F]">{i + 1}</span>
                    <span className="truncate">{score.name || "anon"}</span>
                    <span className="text-right font-medium text-[#D6FF3D]">{score.wpm}</span>
                    <span className="text-right text-[#6F6A5F]">{score.races ?? 0}</span>
                    <span className="text-right text-[#6F6A5F]">{score.accuracy}%</span>
                </div>
            ))}
            {scores.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-[#6F6A5F]">no scores yet</div>
            )}
        </div>
    );
}