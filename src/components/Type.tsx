import { useEffect, useRef } from "react";
import gsap from "gsap";
import { colors, mono } from "../lib/theme";

interface Props {
    text: string;
    typed: string;
    rival: number;
}

export default function Type({ text, typed, rival }: Props) {
    const refs = useRef<Record<number, HTMLSpanElement | null>>({});
    const mine = useRef<HTMLSpanElement>(null);
    const other = useRef<HTMLSpanElement>(null);

    const mark = text.length ? Math.min(text.length - 1, Math.round((rival / 100) * text.length)) : 0;

    function place(index: number, end: boolean) {
        const clamped = Math.max(0, Math.min(text.length - 1, index));
        const span = refs.current[clamped];
        if (!span) return { left: 0, top: 0 };
        return { left: span.offsetLeft + (end ? span.offsetWidth : 0), top: span.offsetTop };
    }

    useEffect(() => {
        const a = place(typed.length, typed.length >= text.length);
        if (mine.current) gsap.to(mine.current, { left: a.left, top: a.top, duration: 0.12, ease: "power2.out" });

        const b = place(mark, false);
        if (other.current) gsap.to(other.current, { left: b.left, top: b.top, duration: 0.12, ease: "power2.out" });
    }, [typed, rival, text]);

    return (
<div className="relative max-w-3xl select-none whitespace-pre-wrap break-words text-xl leading-[2] tracking-wide sm:text-2xl" style={mono}>
            {text.split("").map((char, i) => {
                const past = i < typed.length;
                const current = i === typed.length;
                const right = past && typed[i] === char;
                const wrong = past && typed[i] !== char;
                const style: React.CSSProperties = wrong
                    ? { backgroundColor: colors.error + "26", color: colors.error, borderRadius: 3 }
                    : right
                        ? { color: colors.text }
                        : current
                            ? { color: colors.faint, backgroundColor: colors.accent + "14", borderRadius: 3 }
                            : { color: colors.faint };
                return (
                    <span key={i} ref={el => { refs.current[i] = el; }} style={style}>
                        {char}
                    </span>
                );
            })}
            <span ref={other} className="pointer-events-none absolute left-0 top-0 w-[2px] rounded-full" style={{ height: "1.15em", backgroundColor: colors.rival }} />
            <span ref={mine} className="pointer-events-none absolute left-0 top-0 w-[2px] animate-[blink_1s_step-end_infinite] rounded-full" style={{ height: "1.15em", backgroundColor: colors.accent }} />
        </div>
    );
}