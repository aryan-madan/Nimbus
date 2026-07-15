import { type RefObject, useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import Type from "../components/Type";

interface Props {
    text: string;
    typed: string;
    rival: number;
    rivalName: string;
    inputRef: RefObject<HTMLInputElement | null>;
    onType: (value: string) => void;
}

export default function Race({ text, typed, rival, rivalName, inputRef, onType }: Props) {
    const cardRef = useRef<HTMLDivElement>(null);
    const mine = useMemo(() => (text.length ? Math.min(100, (typed.length / text.length) * 100) : 0), [typed, text]);

    useEffect(() => {
        if (cardRef.current) gsap.fromTo(cardRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
    }, [text]);

    return (
        <div onClick={() => inputRef.current?.focus()} className="flex min-h-screen w-full flex-col items-center justify-center bg-[#121110] px-6 pt-24">
            <div className="mb-3 w-full max-w-3xl text-xs text-[#6F6A5F]">
                racing <span className="text-[#5D8AFF]">{rivalName || "opponent"}</span>
            </div>
            <div className="mb-8 h-px w-full max-w-3xl bg-[#2C2A27]">
                <div className="h-px bg-[#D6FF3D] transition-[width] duration-150 ease-out" style={{ width: mine + "%" }} />
            </div>
            <div ref={cardRef} className="w-full max-w-3xl rounded-2xl border border-[#2C2A27] bg-[#1B1918] p-8 sm:p-10">
                <Type text={text} typed={typed} rival={rival} />
            </div>
            <input
                ref={inputRef}
                value={typed}
                onChange={event => onType(event.target.value)}
                autoFocus
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                className="pointer-events-none absolute h-px w-px opacity-0"
            />
        </div>
    );
}