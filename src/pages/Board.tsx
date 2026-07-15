import { useEffect, useRef } from "react";
import gsap from "gsap";
import Leaderboard from "../components/Leaderboard";
import { type Score } from "../lib/fire";

interface Props {
    board: Score[];
    onBack: () => void;
}

export default function Board({ board, onBack }: Props) {
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (rootRef.current) gsap.fromTo(rootRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" });
    }, []);

    return (
        <div ref={rootRef} className="flex min-h-screen w-full flex-col items-center px-6 pb-16 pt-32">
            <div className="w-full max-w-md">
                <button onClick={onBack} className="mb-8 text-xs font-medium text-[#6F6A5F] transition-colors duration-150 hover:text-[#F2EEE6]">
                    ← back
                </button>
                <Leaderboard scores={board} />
            </div>
        </div>
    );
}