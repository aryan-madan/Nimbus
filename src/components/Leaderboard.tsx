import { useMemo, useState } from "react";
import { colors, mono } from "../lib/theme";
import { type Score } from "../lib/fire";

interface Props {
    scores: Score[];
}

type Sort = "wpm" | "races" | "elo";

export default function Leaderboard({ scores }: Props) {
    const [sort, setSort] = useState<Sort>("wpm");

    const list = useMemo(() => {
        const copy = [...scores];
        if (sort === "races") return copy.sort((a, b) => (b.races ?? 0) - (a.races ?? 0));
        if (sort === "elo") return copy.sort((a, b) => (b.elo ?? 1200) - (a.elo ?? 1200));
        return copy.sort((a, b) => b.wpm * (b.accuracy / 100) - a.wpm * (a.accuracy / 100));
    }, [scores, sort]);

    function tab(mode: Sort, label: string) {
        return (
            <button
                onClick={() => setSort(mode)}
                className="rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-150"
                style={{
                    backgroundColor: sort === mode ? colors.accent : "transparent",
                    color: sort === mode ? colors.bg : colors.muted,
                    border: sort === mode ? "none" : `1px solid ${colors.border}`
                }}
            >
                {label}
            </button>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center gap-2">
                {tab("wpm", "wpm")}
                {tab("races", "races")}
                {tab("elo", "elo")}
            </div>

            <div className="overflow-hidden rounded-2xl border" style={{ borderColor: colors.border, backgroundColor: colors.panel }}>
                <div
                    className="grid grid-cols-[2rem_1fr_3rem_3rem_3rem_3.5rem] gap-2 border-b px-4 py-3 text-[10px] font-medium uppercase tracking-wide"
                    style={{ borderColor: colors.border, color: colors.muted }}
                >
                    <span>#</span>
                    <span>name</span>
                    <span className="text-right">wpm</span>
                    <span className="text-right">races</span>
                    <span className="text-right">acc</span>
                    <span className="text-right">elo</span>
                </div>
                {list.map((score, i) => (
                    <div
                        key={i}
                        className="grid grid-cols-[2rem_1fr_3rem_3rem_3rem_3.5rem] gap-2 border-b px-4 py-3 text-sm last:border-b-0"
                        style={{ borderColor: colors.border, color: colors.text }}
                    >
                        <span style={{ color: colors.muted }}>{i + 1}</span>
                        <span className="truncate">{score.name || "anon"}</span>
                        <span className="text-right" style={{ color: sort === "wpm" ? colors.accent : colors.muted, fontWeight: sort === "wpm" ? 700 : 500 }}>{score.wpm}</span>
                        <span className="text-right" style={{ color: sort === "races" ? colors.accent : colors.muted, fontWeight: sort === "races" ? 700 : 500 }}>{score.races ?? 0}</span>
                        <span className="text-right" style={{ color: colors.muted }}>{score.accuracy}%</span>
                        <span className="text-right" style={{ color: sort === "elo" ? colors.accent : colors.muted, fontWeight: sort === "elo" ? 700 : 500 }}>{score.elo ?? 1200}</span>
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