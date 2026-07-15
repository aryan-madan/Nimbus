import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { colors, mono } from "../lib/theme";
import { type Score } from "../lib/fire";

type Stage = "home" | "wait" | "result";

function extract(value: string): string {
    try {
        const url = new URL(value);
        return url.searchParams.get("room") ?? value.trim().toUpperCase();
    } catch {
        return value.trim().toUpperCase();
    }
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
}

export default function Home({ stage, name, setName, locked, joining, create, join, joinCode, link, copied, share, board, verdict, verdictRef, again, rematch }: Props) {
    const [code, setCode] = useState("");
    const codeInput = useRef<HTMLInputElement>(null);
    const root = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        if (!root.current) return;
        const items = root.current.querySelectorAll("[data-in]");
        gsap.fromTo(items, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: "power3.out" });
    }, [stage]);

    return (
        <div ref={root} className="flex min-h-screen w-full flex-col">
            <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-32">
                {stage === "home" && (
                    <div className="flex w-full max-w-md flex-col items-center gap-10">
                        <div data-in className="flex flex-col items-center gap-2 text-center">
                            <h1 className="text-2xl font-medium" style={{ color: colors.text }}>race a friend, same passage, real time</h1>
                        </div>

                        <div data-in className="w-full">
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
                                <div className="mt-1.5 text-center text-[10px]" style={{ color: colors.muted }}>signed in as {name || "racer"} · change in settings</div>
                            )}
                        </div>

                        <div data-in className="grid w-full grid-cols-2 gap-3">
                            <button
                                onClick={create}
                                className="rounded-lg py-3.5 text-sm font-medium transition-opacity duration-150 hover:opacity-90 active:opacity-80"
                                style={{ backgroundColor: colors.accent, color: colors.bg }}
                            >
                                start race
                            </button>
                            <button
                                onClick={() => (joining ? join() : codeInput.current?.focus())}
                                className="rounded-lg border py-3.5 text-sm font-medium transition-colors duration-150"
                                style={{ borderColor: colors.border, color: colors.text }}
                                onMouseEnter={event => (event.currentTarget.style.borderColor = colors.muted)}
                                onMouseLeave={event => (event.currentTarget.style.borderColor = colors.border)}
                            >
                                {joining ? "join " + joining : "join race"}
                            </button>
                        </div>

                        <div data-in className="flex w-full gap-2">
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
                            <div data-in className="flex w-full items-center justify-center gap-6 text-xs" style={{ ...mono, color: colors.muted }}>
                                <span>fastest <span style={{ color: colors.text }}>{stats.fastest}</span></span>
                                <span>best <span style={{ color: colors.text }}>{stats.acc}</span></span>
                                <span>races <span style={{ color: colors.text }}>{stats.races}</span></span>
                            </div>
                        )}
                    </div>
                )}

                {stage === "wait" && (
                    <div data-in className="flex w-full max-w-md flex-col items-center gap-6 text-center">
                        <h1 className="text-lg font-medium" style={{ color: colors.text }}>waiting for your friend</h1>
                        <div className="flex w-full gap-2">
                            <input
                                readOnly
                                value={link}
                                className="flex-1 truncate rounded-lg border px-3 py-2.5 text-xs"
                                style={{ ...mono, borderColor: colors.border, backgroundColor: colors.panel, color: colors.muted }}
                            />
                            <button
                                onClick={share}
                                className="shrink-0 rounded-lg px-4 text-xs font-medium transition-opacity duration-150 hover:opacity-90"
                                style={{ backgroundColor: colors.accent, color: colors.bg }}
                            >
                                {copied ? "copied" : "copy"}
                            </button>
                        </div>
                        <span className="inline-block h-4 w-[2px] animate-[blink_1s_step-end_infinite]" style={{ backgroundColor: colors.muted }} />
                    </div>
                )}

                {stage === "result" && (
                    <div className="flex w-full max-w-md flex-col items-center gap-8">
                        <h1 ref={verdictRef} className="text-center text-xl font-medium" style={{ ...mono, color: colors.text }}>
                            {verdict}
                        </h1>
                        <div data-in className="flex w-full flex-col gap-3">
                            <button
                                onClick={rematch}
                                className="w-full rounded-lg py-3.5 text-sm font-medium transition-opacity duration-150 hover:opacity-90"
                                style={{ backgroundColor: colors.accent, color: colors.bg }}
                            >
                                rematch
                            </button>
                            <button
                                onClick={again}
                                className="w-full rounded-lg border py-3.5 text-sm font-medium transition-colors duration-150"
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