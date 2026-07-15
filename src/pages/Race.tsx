import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { Check, Loader2 } from "lucide-react";
import Type from "../components/Type";

interface Props {
    text: string;
    typed: string;
    rival: number;
    rivalName: string;
    youReady: boolean;
    rivalReady: boolean;
    inputRef: RefObject<HTMLInputElement | null>;
    onType: (value: string) => void;
    onReady: () => void;
    onRematch: () => void;
    onStart: () => void;
}

export default function Race({ text, typed, rival, rivalName, youReady, rivalReady, inputRef, onType, onReady, onRematch, onStart }: Props) {
    const cardRef = useRef<HTMLDivElement>(null);
    const readyCardRef = useRef<HTMLDivElement>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [waitTime, setWaitTime] = useState(15);
    const started = countdown === 0;
    const finished = text.length > 0 && typed.length >= text.length;
    const startedOnce = useRef(false);
    const mine = useMemo(() => (text.length ? Math.min(100, (typed.length / text.length) * 100) : 0), [typed, text]);

    useEffect(() => {
        if (cardRef.current) gsap.fromTo(cardRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
    }, [text]);

    useEffect(() => {
        setCountdown(null);
        setWaitTime(15);
        startedOnce.current = false;
    }, [text]);

    useEffect(() => {
        if (countdown !== null) return;
        if (youReady && rivalReady) {
            setCountdown(5);
            return;
        }
        const id = setInterval(() => {
            setWaitTime(w => {
                if (w <= 1) {
                    setCountdown(5);
                    return 0;
                }
                return w - 1;
            });
        }, 1000);
        return () => clearInterval(id);
    }, [youReady, rivalReady, countdown]);

    useEffect(() => {
        if (countdown === null || countdown <= 0) return;
        const id = setInterval(() => {
            setCountdown(c => (c === null ? null : c - 1));
        }, 1000);
        return () => clearInterval(id);
    }, [countdown]);

    useEffect(() => {
        if (countdown === 0 && !startedOnce.current) {
            startedOnce.current = true;
            onStart();
        }
        if (started) inputRef.current?.focus();
    }, [countdown, started, onStart, inputRef]);

    useEffect(() => {
        if (readyCardRef.current) {
            gsap.to(readyCardRef.current, { scale: youReady && rivalReady ? 1.02 : 1, duration: 0.3, ease: "power2.out" });
        }
    }, [youReady, rivalReady]);

    function handleType(value: string) {
        if (!started || finished) return;
        onType(value);
    }

    const waitPercent = (waitTime / 15) * 100;

    return (
        <div onClick={() => started && !finished && inputRef.current?.focus()} className="flex min-h-screen w-full flex-col items-center justify-center bg-[#121110] px-6 pt-24">
            <div className="mb-3 w-full max-w-3xl text-xs text-[#6F6A5F]">
                racing <span className="text-[#5D8AFF]">{rivalName || "opponent"}</span>
            </div>
            <div className="mb-8 h-px w-full max-w-3xl bg-[#2C2A27]">
                <div className="h-px bg-[#D6FF3D] transition-[width] duration-150 ease-out" style={{ width: mine + "%" }} />
            </div>
            <div ref={cardRef} className="relative w-full max-w-3xl rounded-2xl border border-[#2C2A27] bg-[#1B1918] p-8 sm:p-10">
                <Type text={text} typed={typed} rival={rival} />

                {countdown === null && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#121110]/95 backdrop-blur-sm">
                        <div ref={readyCardRef} className="flex w-full max-w-xs flex-col items-center gap-6 px-6">
                            <div className="flex w-full items-center justify-between gap-4">
                                <div className="flex flex-1 flex-col items-center gap-2">
                                    <div className={"flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors duration-300 " + (youReady ? "border-[#D6FF3D] bg-[#D6FF3D]/10" : "border-[#2C2A27]")}>
                                        {youReady ? <Check size={20} className="text-[#D6FF3D]" /> : <span className="text-xs text-[#6F6A5F]">you</span>}
                                    </div>
                                    <span className={"text-[11px] " + (youReady ? "text-[#D6FF3D]" : "text-[#6F6A5F]")}>{youReady ? "ready" : "not ready"}</span>
                                </div>

                                <div className="text-[10px] uppercase tracking-widest text-[#3E3B36]">vs</div>

                                <div className="flex flex-1 flex-col items-center gap-2">
                                    <div className={"flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors duration-300 " + (rivalReady ? "border-[#5D8AFF] bg-[#5D8AFF]/10" : "border-[#2C2A27]")}>
                                        {rivalReady ? <Check size={20} className="text-[#5D8AFF]" /> : <Loader2 size={16} className="animate-spin text-[#6F6A5F]" />}
                                    </div>
                                    <span className={"max-w-[6rem] truncate text-[11px] " + (rivalReady ? "text-[#5D8AFF]" : "text-[#6F6A5F]")}>
                                        {rivalReady ? (rivalName || "opponent") : "waiting"}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={onReady}
                                disabled={youReady}
                                className="w-full rounded-lg bg-[#D6FF3D] py-3 text-sm font-medium text-[#121110] transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-30"
                            >
                                {youReady ? "waiting for opponent" : "ready up"}
                            </button>

                            <div className="flex w-full flex-col items-center gap-1.5">
                                <div className="h-[3px] w-full overflow-hidden rounded-full bg-[#2C2A27]">
                                    <div className="h-full rounded-full bg-[#3E3B36] transition-[width] duration-1000 ease-linear" style={{ width: waitPercent + "%" }} />
                                </div>
                                <span className="text-[10px] text-[#6F6A5F]">auto-starts in {waitTime}s</span>
                            </div>
                        </div>
                    </div>
                )}

                {countdown !== null && countdown > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#121110]/90 backdrop-blur-sm">
                        <div key={countdown} className="text-7xl font-semibold text-[#D6FF3D]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {countdown}
                        </div>
                    </div>
                )}

                {finished && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 rounded-2xl bg-[#121110]/95 backdrop-blur-sm">
                        <div className="text-sm text-[#6F6A5F]">race finished</div>
                        <button
                            onClick={onRematch}
                            className="rounded-lg bg-[#D6FF3D] px-6 py-2.5 text-sm font-medium text-[#121110] transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                        >
                            rematch
                        </button>
                    </div>
                )}
            </div>
            <input
                ref={inputRef}
                value={typed}
                onChange={event => handleType(event.target.value)}
                autoFocus
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                disabled={!started || finished}
                className="pointer-events-none absolute h-px w-px opacity-0"
            />
        </div>
    );
}