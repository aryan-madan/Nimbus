import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Check, Loader2 } from "lucide-react";
import Type from "../components/Type";
import { colors, mono } from "../lib/theme";

interface Props {
    text: string;
    typed: string;
    rival: number;
    rivalName: string;
    ready: boolean;
    rivalReady: boolean;
    input: React.RefObject<HTMLInputElement | null>;
    type: (value: string) => void;
    onReady: () => void;
    start: () => void;
    leave: () => void;
}

const FINISH_WINDOW_MS = 15000;

export default function Race({ text, typed, rival, rivalName, ready, rivalReady, input, type, onReady, start, leave }: Props) {
    const card = useRef<HTMLDivElement>(null);
    const box = useRef<HTMLDivElement>(null);
    const [count, setCount] = useState<number | null>(null);
    const [wait, setWait] = useState(15);
    const [finishDeadline, setFinishDeadline] = useState<number | null>(null);
    const [remaining, setRemaining] = useState<number | null>(null);
    const [myFinishAt, setMyFinishAt] = useState<number | null>(null);
    const [rivalFinishAt, setRivalFinishAt] = useState<number | null>(null);
    const started = count === 0;
    const done = text.length > 0 && typed.length >= text.length;
    const rivalDone = text.length > 0 && rival >= text.length;
    const once = useRef(false);
    const finished = done || rivalDone;
    const iWon = myFinishAt !== null && rivalFinishAt !== null && myFinishAt <= rivalFinishAt;

    useEffect(() => {
        if (card.current) gsap.fromTo(card.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
    }, [text]);

    useEffect(() => {
        setCount(null);
        setWait(15);
        setFinishDeadline(null);
        setRemaining(null);
        setMyFinishAt(null);
        setRivalFinishAt(null);
        once.current = false;
    }, [text]);

    useEffect(() => {
        if (count !== null) return;
        if (ready && rivalReady) {
            setCount(5);
            return;
        }
        const id = setInterval(() => {
            setWait(w => {
                if (w <= 1) {
                    setCount(5);
                    return 0;
                }
                return w - 1;
            });
        }, 1000);
        return () => clearInterval(id);
    }, [ready, rivalReady, count]);

    useEffect(() => {
        if (count === null || count <= 0) return;
        const id = setInterval(() => {
            setCount(c => (c === null ? null : c - 1));
        }, 1000);
        return () => clearInterval(id);
    }, [count]);

    useEffect(() => {
        if (count === 0 && !once.current) {
            once.current = true;
            start();
        }
        if (started) input.current?.focus();
    }, [count, started, start, input]);

    useEffect(() => {
        if (box.current) gsap.to(box.current, { scale: ready && rivalReady ? 1.02 : 1, duration: 0.3, ease: "power2.out" });
    }, [ready, rivalReady]);

    useEffect(() => {
        if (done && myFinishAt === null) setMyFinishAt(Date.now());
    }, [done, myFinishAt]);

    useEffect(() => {
        if (rivalDone && rivalFinishAt === null) setRivalFinishAt(Date.now());
    }, [rivalDone, rivalFinishAt]);

    useEffect(() => {
        if (finished && finishDeadline === null) {
            setFinishDeadline(Date.now() + FINISH_WINDOW_MS);
        }
    }, [finished, finishDeadline]);

    useEffect(() => {
        if (finishDeadline === null) return;

        const tick = () => {
            const left = Math.max(0, Math.ceil((finishDeadline - Date.now()) / 1000));
            setRemaining(left);
            if (left <= 0) leave();
        };

        tick();
        const id = setInterval(tick, 250);
        return () => clearInterval(id);
    }, [finishDeadline, leave]);

    function type_(value: string) {
        if (!started || done) return;
        type(value);
    }

    function blockPaste(event: React.ClipboardEvent<HTMLInputElement>) {
        event.preventDefault();
    }

    const percent = (wait / 15) * 100;

    let status = "";
    if (finishDeadline !== null) {
        if (done && !rivalDone) {
            status = "waiting for opponent";
        } else if (!done && rivalDone) {
            status = "opponent finished";
        } else if (done && rivalDone) {
            status = iWon ? "you win" : `${rivalName || "opponent"} wins`;
        }
    }

    return (
        <div
            onClick={() => started && !done && input.current?.focus()}
            className="flex min-h-screen w-full -translate-y-8 flex-col items-center justify-center px-6 pt-24"
            style={{ backgroundColor: colors.bg }}
        >
            <div className="mb-3 flex w-full max-w-3xl items-center justify-between text-xs" style={{ color: colors.muted }}>
                <span>racing <span style={{ color: colors.rival }}>{rivalName || "opponent"}</span></span>
                {finishDeadline !== null && (
                    <span style={{ color: done && !rivalDone ? colors.muted : iWon ? colors.accent : colors.rival }}>
                        {status} — {remaining ?? 15}s
                    </span>
                )}
            </div>
            <div
                ref={card}
                className={
                    "relative w-full max-w-3xl overflow-hidden rounded-2xl border p-8 transition-[min-height] duration-300 sm:p-10 " +
                    (count === null ? "min-h-[22rem] sm:min-h-[24rem]" : "min-h-[12rem]")
                }
                style={{ borderColor: colors.border, backgroundColor: colors.panel }}
            >
                <Type text={text} typed={typed} rival={rival} />

                {count === null && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
                        <div ref={box} className="flex w-full max-w-xs flex-col items-center gap-6 px-8">
                            <div className="flex w-full items-center justify-between gap-4">
                                <div className="flex flex-1 flex-col items-center gap-2">
                                    <div
                                        className="flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors duration-300"
                                        style={{ borderColor: ready ? colors.accent : colors.border, backgroundColor: ready ? colors.accent + "1A" : "transparent" }}
                                    >
                                        {ready ? <Check size={18} color={colors.accent} /> : <span className="text-[10px]" style={{ color: colors.muted }}>you</span>}
                                    </div>
                                    <span className="text-[11px]" style={{ color: ready ? colors.accent : colors.muted }}>{ready ? "ready" : "not ready"}</span>
                                </div>

                                <div className="pb-5 text-[10px] uppercase tracking-widest" style={{ color: colors.faint }}>vs</div>

                                <div className="flex flex-1 flex-col items-center gap-2">
                                    <div
                                        className="flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors duration-300"
                                        style={{ borderColor: rivalReady ? colors.rival : colors.border, backgroundColor: rivalReady ? colors.rival + "1A" : "transparent" }}
                                    >
                                        {rivalReady ? <Check size={18} color={colors.rival} /> : <Loader2 size={15} className="animate-spin" color={colors.muted} />}
                                    </div>
                                    <span className="max-w-[6rem] truncate text-[11px]" style={{ color: rivalReady ? colors.rival : colors.muted }}>
                                        {rivalReady ? (rivalName || "opponent") : "waiting"}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={onReady}
                                disabled={ready}
                                className="w-full rounded-lg py-3 text-sm font-medium transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-30"
                                style={{ backgroundColor: colors.accent, color: colors.bg }}
                            >
                                {ready ? "waiting for opponent" : "ready up"}
                            </button>

                            <div className="flex w-full flex-col items-center gap-2">
                                <div className="h-[3px] w-full overflow-hidden rounded-full" style={{ backgroundColor: colors.border }}>
                                    <div className="h-full rounded-full transition-[width] duration-1000 ease-linear" style={{ width: percent + "%", backgroundColor: colors.faint }} />
                                </div>
                                <span className="text-[10px]" style={{ color: colors.muted }}>auto-starts in {wait}s</span>
                            </div>
                        </div>
                    </div>
                )}

                {count !== null && count > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
                        <div key={count} className="text-7xl font-semibold" style={{ ...mono, color: colors.accent }}>
                            {count}
                        </div>
                    </div>
                )}
            </div>
            <input
                ref={input}
                value={typed}
                onChange={event => type_(event.target.value)}
                onPaste={blockPaste}
                autoFocus
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                disabled={!started || done}
                className="pointer-events-none absolute h-px w-px opacity-0"
            />
        </div>
    );
}