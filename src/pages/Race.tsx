import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
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
}

export default function Race({ text, typed, rival, rivalName, youReady, rivalReady, inputRef, onType, onReady, onRematch }: Props) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [waitTime, setWaitTime] = useState(15);
    const started = countdown === 0;
    const finished = text.length > 0 && typed.length >= text.length;
    const mine = useMemo(() => (text.length ? Math.min(100, (typed.length / text.length) * 100) : 0), [typed, text]);

    useEffect(() => {
        if (cardRef.current) gsap.fromTo(cardRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
    }, [text]);

    useEffect(() => {
        setCountdown(null);
        setWaitTime(15);
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
        if (started) inputRef.current?.focus();
    }, [started, inputRef]);

    function handleType(value: string) {
        if (!started || finished) return;
        onType(value);
    }

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
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-[#1B1918]/95">
                        <div className="flex gap-6 text-sm">
                            <div className={youReady ? "text-[#D6FF3D]" : "text-[#6F6A5F]"}>you {youReady ? "ready" : "not ready"}</div>
                            <div className={rivalReady ? "text-[#D6FF3D]" : "text-[#6F6A5F]"}>{rivalName || "opponent"} {rivalReady ? "ready" : "not ready"}</div>
                        </div>
                        <button
                            onClick={onReady}
                            disabled={youReady}
                            className="rounded-lg bg-[#D6FF3D] px-5 py-2 text-sm font-medium text-[#121110] transition-opacity duration-150 disabled:opacity-40"
                        >
                            {youReady ? "waiting..." : "ready up"}
                        </button>
                        <div className="text-[10px] text-[#6F6A5F]">starts automatically in {waitTime}s</div>
                    </div>
                )}
                {countdown !== null && countdown > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#1B1918]/90 backdrop-blur-sm">
                        <div key={countdown} className="text-6xl font-semibold text-[#D6FF3D]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {countdown}
                        </div>
                    </div>
                )}
                {finished && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-[#1B1918]/95">
                        <div className="text-sm text-[#6F6A5F]">race finished</div>
                        <button
                            onClick={onRematch}
                            className="rounded-lg bg-[#D6FF3D] px-5 py-2 text-sm font-medium text-[#121110]"
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