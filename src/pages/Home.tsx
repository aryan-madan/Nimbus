import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { Zap, Users } from "lucide-react";
import { colors, mono } from "../lib/theme";
import { type Score } from "../lib/fire";

type Stage = "home" | "wait" | "queue" | "found" | "result";

function extract(value: string): string {
    try {
        const url = new URL(value);
        return url.searchParams.get("room") ?? value.trim().toUpperCase();
    } catch {
        return value.trim().toUpperCase();
    }
}

interface Opponent {
    uid: string;
    name: string;
    elo: number;
}

interface Props {
    stage: Stage;
    name: string;
    setName: (value: string) => void;
    locked: boolean;
    joining: string | null;
    create: () => void;
    join: () => void;
    joinCode: (code: string) => void;
    link: string;
    copied: boolean;
    share: () => void;
    board: Score[];
    verdict: string;
    verdictRef: RefObject<HTMLHeadingElement | null>;
    again: () => void;
    rematch: () => void;
    signedIn: boolean;
    elo: number;
    queueMode: "ranked" | "casual" | null;
    queueRanked: () => void;
    queueCasual: () => void;
    cancelQueue: () => void;
    foundOpponent: Opponent | null;
    foundRanked: boolean;
    eloDelta: number | null;
}

export default function Home({
    stage, name, setName, locked, create, joinCode, link, copied, share,
    board, verdict, verdictRef, again, rematch, signedIn, elo, queueMode, queueRanked, queueCasual, cancelQueue,
    foundOpponent, foundRanked, eloDelta
}: Props) {
    const [code, setCode] = useState("");
    const codeInput = useRef<HTMLInputElement>(null);

    const stats = useMemo(() => {
        if (!board.length) return null;
        const fastest = board.reduce((a, b) => (b.wpm > a.wpm ? b : a));
        const acc = board.reduce((a, b) => (b.accuracy > a.accuracy ? b : a));
        const total = board.reduce((sum, b) => sum + (b.races ?? 0), 0);
        return { fastest: fastest.wpm + "wpm", acc: acc.accuracy + "%", races: String(total) };
    }, [board]);

    function submit() {
        if (code.trim()) joinCode(extract(code));
    }

    const [show, setShow] = useState(false);
    useEffect(() => {
        setShow(false);
        const raf = requestAnimationFrame(() => setShow(true));
        return () => cancelAnimationFrame(raf);
    }, [stage]);

    const enterClass = "transition-all duration-500 ease-out " + (show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2");
    function delay(i: number): React.CSSProperties {
        return { transitionDelay: show ? `${i * 60}ms` : "0ms" };
    }

    const resultRanked = eloDelta !== null;

    return (
        <div className="flex min-h-screen w-full flex-col">
            <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-32">
                {stage === "home" && (
                    <div className="flex w-full max-w-md flex-col items-center gap-8">
                        <div className={enterClass + " flex flex-col items-center gap-2 text-center"} style={delay(0)}>
                            <h1 className="text-2xl font-medium" style={{ color: colors.text }}>multiplayer type type :D</h1>
                        </div>

                        <div className={enterClass + " w-full"} style={delay(1)}>
                            <input
                                value={name}
                                maxLength={16}
                                onChange={event => setName(event.target.value)}
                                readOnly={locked}
                                placeholder={locked ? "" : "your name"}
                                title={locked ? "signed in — change your name in settings" : undefined}
                                className={"w-full border-b bg-transparent py-3 text-center text-sm outline-none transition-colors duration-150" + (locked ? " cursor-default opacity-70" : "")}
                                style={{ borderColor: colors.border, color: colors.text }}
                                onFocus={event => !locked && (event.currentTarget.style.borderColor = colors.accent)}
                                onBlur={event => (event.currentTarget.style.borderColor = colors.border)}
                            />
                            {locked && (
                                <div className="mt-1.5 text-center text-[10px]" style={{ color: colors.muted }}>signed in as {name || "racer"} · elo {elo}</div>
                            )}
                        </div>

                        <button
                            onClick={create}
                            className={enterClass + " w-full rounded-2xl py-4 text-sm font-medium hover:opacity-90 active:scale-[0.98] active:opacity-80"}
                            style={{ ...delay(2), backgroundColor: colors.accent, color: colors.bg }}
                        >
                            start race
                        </button>

                        <div className={enterClass + " flex w-full flex-col overflow-hidden rounded-2xl border"} style={{ ...delay(3), borderColor: colors.border, backgroundColor: colors.panel }}>
                            <div
                                className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide"
                                style={{ color: colors.muted }}
                            >
                                quick match
                            </div>

                            <div className="h-px w-full" style={{ backgroundColor: colors.border }} />

                            <button
                                onClick={queueRanked}
                                disabled={!signedIn}
                                title={signedIn ? undefined : "sign in to play ranked"}
                                className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-30"
                                style={{ color: colors.accent }}
                                onMouseEnter={event => signedIn && (event.currentTarget.style.backgroundColor = colors.border)}
                                onMouseLeave={event => (event.currentTarget.style.backgroundColor = "transparent")}
                            >
                                <Zap size={15} strokeWidth={2.25} style={{ color: colors.accent }} />
                                <span className="flex-1 font-medium">ranked queue</span>
                                <span className="text-[10px]" style={{ ...mono, color: colors.accent, opacity: 0.75 }}>±elo</span>
                            </button>

                            <div className="h-px w-full" style={{ backgroundColor: colors.border }} />

                            <button
                                onClick={queueCasual}
                                className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm transition-colors duration-150"
                                style={{ color: colors.text }}
                                onMouseEnter={event => (event.currentTarget.style.backgroundColor = colors.border)}
                                onMouseLeave={event => (event.currentTarget.style.backgroundColor = "transparent")}
                            >
                                <Users size={15} strokeWidth={2.25} style={{ color: colors.muted }} />
                                <span className="flex-1">casual queue</span>
                                <span className="text-[10px]" style={{ ...mono, color: colors.faint }}>no elo</span>
                            </button>
                        </div>

                        <div className={enterClass + " flex w-full gap-2"} style={delay(4)}>
                            <input
                                ref={codeInput}
                                value={code}
                                onChange={event => setCode(event.target.value)}
                                onKeyDown={event => event.key === "Enter" && submit()}
                                placeholder="paste link or code"
                                className="flex-1 border-b bg-transparent py-2.5 text-xs outline-none transition-colors duration-150"
                                style={{ ...mono, borderColor: colors.border, color: colors.text }}
                                onFocus={event => (event.currentTarget.style.borderColor = colors.accent)}
                                onBlur={event => (event.currentTarget.style.borderColor = colors.border)}
                            />
                            <button
                                onClick={submit}
                                className="text-xs font-medium transition-colors duration-150"
                                style={{ color: colors.muted }}
                                onMouseEnter={event => (event.currentTarget.style.color = colors.text)}
                                onMouseLeave={event => (event.currentTarget.style.color = colors.muted)}
                            >
                                go
                            </button>
                        </div>

                        {stats && (
                            <div className={enterClass + " flex w-full items-center justify-center gap-6 text-xs"} style={{ ...delay(5), ...mono, color: colors.muted }}>
                                <span>fastest <span style={{ color: colors.text }}>{stats.fastest}</span></span>
                                <span>best <span style={{ color: colors.text }}>{stats.acc}</span></span>
                                <span>races <span style={{ color: colors.text }}>{stats.races}</span></span>
                            </div>
                        )}
                    </div>
                )}

                {stage === "queue" && (
                    <div className={enterClass + " flex w-full max-w-md flex-col items-center gap-6 text-center"} style={delay(0)}>
                        <h1 className="text-lg font-medium" style={{ color: colors.text }}>
                            {queueMode === "ranked" ? "finding a ranked match" : "finding an opponent"}
                        </h1>
                        <span className="inline-block h-4 w-[2px] animate-[blink_1s_step-end_infinite]" style={{ backgroundColor: colors.muted }} />
                        <button
                            onClick={cancelQueue}
                            className="rounded-2xl border px-5 py-2.5 text-xs font-medium transition-colors duration-150"
                            style={{ borderColor: colors.border, color: colors.muted }}
                            onMouseEnter={event => (event.currentTarget.style.borderColor = colors.muted)}
                            onMouseLeave={event => (event.currentTarget.style.borderColor = colors.border)}
                        >
                            cancel
                        </button>
                    </div>
                )}

                {stage === "found" && (
                    <div className={enterClass + " flex w-full max-w-md flex-col items-center gap-8 text-center"} style={delay(0)}>
                        <h1 className="text-lg font-medium" style={{ color: colors.text }}>match found</h1>
                        <div className="flex w-full items-center justify-center gap-6">
                            <div className="flex flex-1 flex-col items-center gap-1">
                                <span className="max-w-[8rem] truncate text-sm font-medium" style={{ color: colors.text }}>{name || "you"}</span>
                                {foundRanked && <span className="text-xs" style={{ ...mono, color: colors.accent }}>{elo}</span>}
                            </div>
                            <span className="text-[10px] uppercase tracking-widest" style={{ color: colors.faint }}>vs</span>
                            <div className="flex flex-1 flex-col items-center gap-1">
                                <span className="max-w-[8rem] truncate text-sm font-medium" style={{ color: colors.rival }}>{foundOpponent?.name || "opponent"}</span>
                                {foundRanked && <span className="text-xs" style={{ ...mono, color: colors.rival }}>{foundOpponent?.elo ?? 1200}</span>}
                            </div>
                        </div>
                        <span className="inline-block h-4 w-[2px] animate-[blink_1s_step-end_infinite]" style={{ backgroundColor: colors.muted }} />
                    </div>
                )}

                {stage === "wait" && (
                    <div className={enterClass + " flex w-full max-w-md flex-col items-center gap-6 text-center"} style={delay(0)}>
                        <h1 className="text-lg font-medium" style={{ color: colors.text }}>waiting for your friend</h1>
                        <div className="flex w-full gap-2">
                            <input
                                readOnly
                                value={link}
                                className="flex-1 truncate rounded-2xl border px-3 py-2.5 text-xs"
                                style={{ ...mono, borderColor: colors.border, backgroundColor: colors.panel, color: colors.muted }}
                            />
                            <button
                                onClick={share}
                                className="shrink-0 rounded-2xl px-4 text-xs font-medium transition-opacity duration-150 hover:opacity-90"
                                style={{ backgroundColor: colors.accent, color: colors.bg }}
                            >
                                {copied ? "copied" : "copy"}
                            </button>
                        </div>
                        <span className="inline-block h-4 w-[2px] animate-[blink_1s_step-end_infinite]" style={{ backgroundColor: colors.muted }} />
                    </div>
                )}

                {stage === "result" && (
                    <div className="flex w-full max-w-md flex-col items-center gap-6">
                        <h1 ref={verdictRef} className="text-center text-xl font-medium" style={{ ...mono, color: colors.text }}>
                            {verdict}
                        </h1>
                        {eloDelta !== null && (
                            <div
                                className="rounded-full px-4 py-1.5 text-sm font-semibold"
                                style={{ ...mono, color: eloDelta >= 0 ? colors.accent : colors.error, backgroundColor: (eloDelta >= 0 ? colors.accent : colors.error) + "1A" }}
                            >
                                {eloDelta >= 0 ? "+" : ""}{eloDelta} elo
                            </div>
                        )}
                        <div className={enterClass + " flex w-full flex-col gap-3"} style={delay(0)}>
                            {!resultRanked && (
                                <button
                                    onClick={rematch}
                                    className="w-full rounded-2xl py-3.5 text-sm font-medium transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                                    style={{ backgroundColor: colors.accent, color: colors.bg }}
                                >
                                    rematch
                                </button>
                            )}
                            <button
                                onClick={again}
                                className="w-full rounded-2xl border py-3.5 text-sm font-medium transition-colors duration-150"
                                style={{ borderColor: colors.border, color: colors.text }}
                                onMouseEnter={event => (event.currentTarget.style.borderColor = colors.muted)}
                                onMouseLeave={event => (event.currentTarget.style.borderColor = colors.border)}
                            >
                                new opponent
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <footer className="flex items-center justify-center border-t py-6" style={{ borderColor: colors.border }}>
                <span className="text-xs" style={{ color: colors.muted }}>made with ❤️ by Ary</span>
            </footer>
        </div>
    );
}