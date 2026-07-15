import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ArrowLeft } from "lucide-react";
import { colors, mono } from "../lib/theme";
import { getProfile, setProfileName } from "../lib/fire";
import { type User } from "firebase/auth";

interface Props {
    user: User;
    back: () => void;
}

export default function Settings({ user, back }: Props) {
    const root = useRef<HTMLDivElement>(null);
    const [name, setName] = useState("");
    const [saved, setSaved] = useState("");
    const [busy, setBusy] = useState(false);
    const [wpm, setWpm] = useState(0);
    const [acc, setAcc] = useState(0);
    const [races, setRaces] = useState(0);

    useEffect(() => {
        if (root.current) {
            const items = root.current.querySelectorAll("[data-in]");
            gsap.fromTo(items, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: "power3.out" });
        }
        getProfile(user.uid).then(profile => {
            const value = profile?.name || user.displayName || "";
            setName(value);
            setSaved(value);
            setWpm(profile?.wpm ?? 0);
            setAcc(profile?.accuracy ?? 0);
            setRaces(profile?.races ?? 0);
        });
    }, [user]);

    const dirty = name.trim() !== saved.trim() && name.trim().length > 0;

    async function save() {
        setBusy(true);
        await setProfileName(user.uid, name);
        setSaved(name.trim());
        setBusy(false);
    }

    return (
        <div ref={root} className="flex min-h-screen w-full flex-col items-center px-6 pb-16 pt-32">
            <div className="flex w-full max-w-md flex-col items-center gap-10">
                <div data-in className="flex w-full items-center">
                    <button
                        onClick={back}
                        className="flex items-center gap-1.5 text-xs font-medium transition-colors duration-150"
                        style={{ color: colors.muted }}
                        onMouseEnter={event => (event.currentTarget.style.color = colors.text)}
                        onMouseLeave={event => (event.currentTarget.style.color = colors.muted)}
                    >
                        <ArrowLeft size={13} />
                        back
                    </button>
                </div>

                <div data-in className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-medium" style={{ color: colors.text }}>settings</h1>
                    <span className="text-xs" style={{ color: colors.muted }}>{user.email}</span>
                </div>

                <div data-in className="flex w-full items-center justify-center gap-6 text-xs" style={{ ...mono, color: colors.muted }}>
                    <span>best <span style={{ color: colors.text }}>{wpm}wpm</span></span>
                    <span>acc <span style={{ color: colors.text }}>{acc}%</span></span>
                    <span>races <span style={{ color: colors.text }}>{races}</span></span>
                </div>

                <div data-in className="w-full">
                    <input
                        value={name}
                        onChange={event => setName(event.target.value.slice(0, 16))}
                        maxLength={16}
                        placeholder="your name"
                        className="w-full border-b bg-transparent py-3 text-center text-sm outline-none transition-colors duration-150"
                        style={{ borderColor: colors.border, color: colors.text }}
                        onFocus={event => (event.currentTarget.style.borderColor = colors.accent)}
                        onBlur={event => (event.currentTarget.style.borderColor = colors.border)}
                    />
                    <div className="mt-2 flex items-center justify-center gap-4 text-[10px]" style={{ ...mono, color: colors.muted }}>
                        <span>{name.length}/16</span>
                        <span>·</span>
                        <span>changing this won't affect your rank</span>
                    </div>
                </div>

                <button
                    data-in
                    onClick={save}
                    disabled={busy || !dirty}
                    className="w-full rounded-lg py-3.5 text-sm font-medium transition-opacity duration-150 hover:opacity-90 active:opacity-80 disabled:opacity-30"
                    style={{ backgroundColor: colors.accent, color: colors.bg }}
                >
                    {busy ? "saving..." : dirty ? "save" : "saved"}
                </button>
            </div>
        </div>
    );
}