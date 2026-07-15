import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { getProfileName, setProfileName } from "../lib/fire";
import { type User } from "firebase/auth";

interface Props {
    user: User;
    onBack: () => void;
}

export default function Settings({ user, onBack }: Props) {
    const rootRef = useRef<HTMLDivElement>(null);
    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (rootRef.current) gsap.fromTo(rootRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" });
        getProfileName(user.uid).then(existing => {
            setName(existing || user.displayName || "");
        });
    }, [user]);

    async function handleSave() {
        setSaving(true);
        setSaved(false);
        await setProfileName(user.uid, name);
        setSaving(false);
        setSaved(true);
    }

    return (
        <div ref={rootRef} className="flex min-h-screen w-full flex-col items-center px-6 pb-16 pt-32">
            <div className="w-full max-w-md">
                <button onClick={onBack} className="mb-8 text-xs font-medium text-[#6F6A5F] transition-colors duration-150 hover:text-[#F2EEE6]">
                    ← back
                </button>
                <div className="rounded-2xl border border-[#2C2A27] bg-[#1B1918] p-6">
                    <label className="mb-2 block text-xs font-medium text-[#6F6A5F]">display name</label>
                    <input
                        value={name}
                        onChange={event => setName(event.target.value.slice(0, 16))}
                        maxLength={16}
                        className="w-full rounded-lg border border-[#2C2A27] bg-[#121110] px-3 py-2 text-sm text-[#F2EEE6] outline-none focus:border-[#D6FF3D]"
                    />
                    <div className="mt-2 text-[10px] text-[#6F6A5F]">{name.length}/16 · this only changes your display name, not your leaderboard rank</div>
                    <button
                        onClick={handleSave}
                        disabled={saving || !name.trim()}
                        className="mt-4 w-full rounded-lg bg-[#D6FF3D] py-2 text-sm font-medium text-[#121110] transition-opacity duration-150 disabled:opacity-40"
                    >
                        {saving ? "saving..." : saved ? "saved" : "save"}
                    </button>
                </div>
            </div>
        </div>
    );
}