import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
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
    onName: (value: string) => void;
    joining: string | null;
    onCreate: () => void;
    onJoin: () => void;
    onJoinByCode: (code: string) => void;
    link: string;
    copied: boolean;
    onShare: () => void;
    board: Score[];
    verdict: string;
    verdictRef: RefObject<HTMLHeadingElement | null>;
    onAgain: () => void;
}

const mono = { fontFamily: "'JetBrains Mono', monospace" };

export default function Home({
    stage,
    name,
    onName,
    joining,
    onCreate,
    onJoin,
    onJoinByCode,
    link,
    copied,
    onShare,
    board,
    verdict,
    verdictRef,
    onAgain
}: Props) {
    const [code, setCode] = useState("");
    const codeRef = useRef<HTMLInputElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);

    const stats = useMemo(() => {
        if (!board.length) return null;
        const fastest = board.reduce((a, b) => (b.wpm > a.wpm ? b : a));
        const acc = board.reduce((a, b) => (b.accuracy > a.accuracy ? b : a));
        return { fastest: fastest.wpm + "wpm", acc: acc.accuracy + "%", races: String(board.length) };
    }, [board]);

    function submit() {
        if (code.trim()) onJoinByCode(extract(code));
    }

    useEffect(() => {
        if (!rootRef.current) return;
        const items = rootRef.current.querySelectorAll("[data-in]");
        gsap.fromTo(items, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: "power3.out" });
    }, [stage]);

    return (
        <div ref={rootRef} className="flex min-h-screen w-full flex-col">
            <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-32">
                {stage === "home" && (
                    <div className="flex w-full max-w-md flex-col items-center gap-10">
                        <div data-in className="flex flex-col items-center gap-2 text-center">
                            <h1 className="text-2xl font-medium text-[#F2EEE6]">race a friend, same passage, real time</h1>
                        </div>

                        <div data-in className="w-full">
                            <input
                                value={name}
                                maxLength={16}
                                onChange={event => onName(event.target.value)}
                                placeholder="your name"
                                className="w-full border-b border-[#2C2A27] bg-transparent py-3 text-center text-sm text-[#F2EEE6] placeholder:text-[#6F6A5F] outline-none transition-colors duration-150 focus:border-[#D6FF3D]"
                            />
                        </div>

                        <div data-in className="grid w-full grid-cols-2 gap-3">
                            <button
                                onClick={onCreate}
                                className="rounded-lg bg-[#D6FF3D] py-3.5 text-sm font-medium text-[#121110] transition-opacity duration-150 hover:opacity-90 active:opacity-80"
                            >
                                start race
                            </button>
                            <button
                                onClick={() => (joining ? onJoin() : codeRef.current?.focus())}
                                className="rounded-lg border border-[#2C2A27] py-3.5 text-sm font-medium text-[#F2EEE6] transition-colors duration-150 hover:border-[#6F6A5F]"
                            >
                                {joining ? "join " + joining : "join race"}
                            </button>
                        </div>

                        <div data-in className="flex w-full gap-2">
                            <input
                                ref={codeRef}
                                value={code}
                                onChange={event => setCode(event.target.value)}
                                onKeyDown={event => event.key === "Enter" && submit()}
                                placeholder="paste link or code"
                                style={mono}
                                className="flex-1 border-b border-[#2C2A27] bg-transparent py-2.5 text-xs text-[#F2EEE6] placeholder:text-[#6F6A5F] outline-none transition-colors duration-150 focus:border-[#D6FF3D]"
                            />
                            <button onClick={submit} className="text-xs font-medium text-[#6F6A5F] transition-colors duration-150 hover:text-[#F2EEE6]">
                                go
                            </button>
                        </div>

                        {stats && (
                            <div data-in className="flex w-full items-center justify-center gap-6 text-xs text-[#6F6A5F]" style={mono}>
                                <span>fastest <span className="text-[#F2EEE6]">{stats.fastest}</span></span>
                                <span>best <span className="text-[#F2EEE6]">{stats.acc}</span></span>
                                <span>races <span className="text-[#F2EEE6]">{stats.races}</span></span>
                            </div>
                        )}
                    </div>
                )}

                {stage === "wait" && (
                    <div data-in className="flex w-full max-w-md flex-col items-center gap-6 text-center">
                        <h1 className="text-lg font-medium text-[#F2EEE6]">waiting for your friend</h1>
                        <div className="flex w-full gap-2">
                            <input
                                readOnly
                                value={link}
                                style={mono}
                                className="flex-1 truncate rounded-lg border border-[#2C2A27] bg-[#1B1918] px-3 py-2.5 text-xs text-[#6F6A5F]"
                            />
                            <button
                                onClick={onShare}
                                className="shrink-0 rounded-lg bg-[#D6FF3D] px-4 text-xs font-medium text-[#121110] transition-opacity duration-150 hover:opacity-90"
                            >
                                {copied ? "copied" : "copy"}
                            </button>
                        </div>
                        <span className="inline-block h-4 w-[2px] animate-[blink_1s_step-end_infinite] bg-[#6F6A5F]" />
                    </div>
                )}

                {stage === "result" && (
                    <div className="flex w-full max-w-md flex-col items-center gap-8">
                        <h1 ref={verdictRef} className="text-center text-xl font-medium text-[#F2EEE6]" style={mono}>
                            {verdict}
                        </h1>
                        <button
                            data-in
                            onClick={onAgain}
                            className="w-full rounded-lg bg-[#D6FF3D] py-3.5 text-sm font-medium text-[#121110] transition-opacity duration-150 hover:opacity-90"
                        >
                            race again
                        </button>
                    </div>
                )}
            </main>

            <footer className="flex items-center justify-center border-t border-[#2C2A27] py-6">
                <span className="text-xs text-[#6F6A5F]">made with ❤️ by Ary</span>
            </footer>
        </div>
    );
}