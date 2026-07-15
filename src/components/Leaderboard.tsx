import { useMemo, useState } from "react";
import { colors, mono } from "../lib/theme";
import { type Score } from "../lib/fire";

interface Props {
    scores: Score[];
}

type Sort = "wpm" | "races";

export default function Leaderboard({ scores }: Props) {
    const [sort, setSort] = useState<Sort>("wpm");

    const list = useMemo(() => {
        const copy = [...scores];
        if (sort === "races") return copy.sort((a, b) => (b.races ?? 0) - (a.races ?? 0));
        return copy.sort((a, b) => b.wpm * (b.accuracy / 100) - a.wpm * (a.accuracy / 100));
    }, [scores, sort]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center gap-2">
                <button
                    onClick={() => setSort("wpm")}
                    className="rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-150"
                    style={{
                        backgroundColor: sort === "wpm" ? colors.accent : "transparent",
                        color: sort === "wpm" ? colors.bg : colors.muted,
                        border: sort === "wpm" ? "none" : `1px solid ${colors.border}`
                    }}
                >
                    wpm
                </button>
                <button
                    onClick={() => setSort("races")}
                    className="rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-150"
                    style={{
                        backgroundColor: sort === "races" ? colors.accent : "transparent",
                        color: sort === "races" ? colors.bg : colors.muted,
                        border: sort === "races" ? "none" : `1px solid ${colors.border}`
                    }}
                >
                    races
                </button>
            </div>

            <div className="overflow-hidden rounded-2xl border" style={{ borderColor: colors.border, backgroundColor: colors.panel }}>
                <div
                    className="grid grid-cols-[2rem_1fr_3.5rem_3.5rem_3.5rem] gap-2 border-b px-4 py-3 text-[10px] font-medium uppercase tracking-wide"
                    style={{ borderColor: colors.border, color: colors.muted }}
                >
                    <span>#</span>
                    <span>name</span>
                    <span className="text-right">wpm</span>
                    <span className="text-right">races</span>
                    <span className="text-right">acc</span>
                </div>
                {list.map((score, i) => (
                    <div
                        key={i}
                        className="grid grid-cols-[2rem_1fr_3.5rem_3.5rem_3.5rem] gap-2 border-b px-4 py-3 text-sm last:border-b-0"
                        style={{ borderColor: colors.border, color: colors.text }}
                    >
                        <span style={{ color: colors.muted }}>{i + 1}</span>
                        <span className="truncate">{score.name || "anon"}</span>
                        <span
                            className="text-right"
                            style={{ color: sort === "wpm" ? colors.accent : colors.muted, fontWeight: sort === "wpm" ? 700 : 500 }}
                        >
                            {score.wpm}
                        </span>
                        <span
                            className="text-right"
                            style={{ color: sort === "races" ? colors.accent : colors.muted, fontWeight: sort === "races" ? 700 : 500 }}
                        >
                            {score.races ?? 0}
                        </span>
                        <span className="text-right" style={{ color: colors.muted }}>{score.accuracy}%</span>
                    </div>
                ))}
                {list.length === 0 && (
                    <div className="px-4 py-6 text-center text-sm" style={{ color: colors.muted }}>no scores yet</div>
                )}
            </div>

            <div className="text-center text-[10px]" style={{ ...mono, color: colors.muted }}>
                acc is average across all races
            </div>
        </div>
    );
}