import { useEffect, useRef } from "react";
import gsap from "gsap";

interface Props {
    text: string;
    typed: string;
    rival: number;
}

export default function Type({ text, typed, rival }: Props) {
    const refs = useRef<Record<number, HTMLSpanElement | null>>({});
    const mineRef = useRef<HTMLSpanElement>(null);
    const rivalRef = useRef<HTMLSpanElement>(null);

    const mark = text.length ? Math.min(text.length - 1, Math.round((rival / 100) * text.length)) : 0;

    function place(index: number, end: boolean) {
        const clamped = Math.max(0, Math.min(text.length - 1, index));
        const span = refs.current[clamped];
        if (!span) return { left: 0, top: 0 };
        return { left: span.offsetLeft + (end ? span.offsetWidth : 0), top: span.offsetTop };
    }

    useEffect(() => {
        const mine = place(typed.length, typed.length >= text.length);
        if (mineRef.current) gsap.to(mineRef.current, { left: mine.left, top: mine.top, duration: 0.12, ease: "power2.out" });

        const other = place(mark, false);
        if (rivalRef.current) gsap.to(rivalRef.current, { left: other.left, top: other.top, duration: 0.12, ease: "power2.out" });
    }, [typed, rival, text]);

    return (
        <div className="relative max-w-3xl select-none whitespace-pre-wrap break-words text-xl leading-relaxed sm:text-2xl" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {text.split("").map((char, i) => {
                const past = i < typed.length;
                const right = past && typed[i] === char;
                const wrong = past && typed[i] !== char;
                return (
                    <span key={i} ref={el => { refs.current[i] = el; }} className={right ? "text-[#F2EEE6]" : wrong ? "bg-[#FF5B54]/15 text-[#FF5B54]" : "text-[#55514A]"}>
                        {char}
                    </span>
                );
            })}
            <span ref={rivalRef} className="pointer-events-none absolute left-0 top-0 w-[2px] rounded-full bg-[#5D8AFF]" style={{ height: "1.15em" }} />
            <span ref={mineRef} className="pointer-events-none absolute left-0 top-0 w-[2px] animate-[blink_1s_step-end_infinite] rounded-full bg-[#D6FF3D]" style={{ height: "1.15em" }} />
        </div>
    );
}