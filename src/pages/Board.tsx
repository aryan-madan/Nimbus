import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ArrowLeft } from "lucide-react";
import Leaderboard from "../components/Leaderboard";
import { colors } from "../lib/theme";
import { type Score } from "../lib/fire";

interface Props {
    board: Score[];
    back: () => void;
}

export default function Board({ board, back }: Props) {
    const root = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (root.current) gsap.fromTo(root.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" });
    }, []);

    return (
        <div ref={root} className="flex min-h-screen w-full flex-col items-center px-6 pb-16 pt-32">
            <div className="w-full max-w-md">
                <button
                    onClick={back}
                    className="mb-8 flex items-center gap-1.5 text-xs font-medium transition-colors duration-150"
                    style={{ color: colors.muted }}
                    onMouseEnter={event => (event.currentTarget.style.color = colors.text)}
                    onMouseLeave={event => (event.currentTarget.style.color = colors.muted)}
                >
                    <ArrowLeft size={13} />
                    back
                </button>
                <Leaderboard scores={board} />
            </div>
        </div>
    );
}