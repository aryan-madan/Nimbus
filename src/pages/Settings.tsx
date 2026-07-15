import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ArrowLeft, Check } from "lucide-react";
import { getProfileName, setProfileName } from "../lib/fire";
import { type User } from "firebase/auth";

interface Props {
    user: User;
    onBack: () => void;
}

export default function Settings({ user, onBack }: Props) {
    const rootRef = useRef<HTMLDivElement>(null);
    const [name, setName] = useState("");
    const [original, setOriginal] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (rootRef.current) gsap.fromTo(rootRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" });
        getProfileName(user.uid).then(existing => {
            const value = existing || user.displayName || "";
            setName(value);
            setOriginal(value);
        });
    }, [user]);

    const dirty = name.trim() !== original.trim() && name.trim().length > 0;

    async function handleSave() {
        setSaving(true);
        setSaved(false);
        await setProfileName(user.uid, name);
        setOriginal(name.trim());
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }

    const initial = (name || user.email || "?").charAt(0).toUpperCase();

    return (
        <div ref={rootRef} className="flex min-h-screen w-full flex-col items-center px-6 pb-16 pt-32">
            <div className="w-full max-w-md">
                <button onClick={onBack} className="mb-8 flex items-center gap-1.5 text-xs font-medium text-[#6F6A5F] transition-colors duration-150 hover:text-[#F2EEE6]">
                    <ArrowLeft size={13} />
                    back
                </button>

                <div className="mb-8 flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#D6FF3D] to-[#5D8AFF] text-lg font-semibold text-[#121110]">
                        {initial}
                    </div>
                    <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-[#F2EEE6]">{name || "racer"}</div>
                        <div className="truncate text-xs text-[#6F6A5F]">{user.email}</div>
                    </div>
                </div>

                <div className="rounded-2xl border border-[#2C2A27] bg-[#1B1918] p-6">
                    <label className="mb-2.5 block text-xs font-medium uppercase tracking-wide text-[#6F6A5F]">display name</label>
                    <input
                        value={name}
                        onChange={event => setName(event.target.value.slice(0, 16))}
                        maxLength={16}
                        placeholder="your name"
                        className="w-full rounded-lg border border-[#2C2A27] bg-[#121110] px-3.5 py-2.5 text-sm text-[#F2EEE6] outline-none transition-colors duration-150 placeholder:text-[#6F6A5F] focus:border-[#D6FF3D]"
                    />
                    <div className="mt-2 flex items-center justify-between text-[10px] text-[#6F6A5F]">
                        <span>this only changes your display name, not your rank</span>
                        <span>{name.length}/16</span>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving || !dirty}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#D6FF3D] py-2.5 text-sm font-medium text-[#121110] transition-all duration-150 active:scale-[0.98] disabled:opacity-30"
                    >
                        {saved ? (
                            <>
                                <Check size={15} />
                                saved
                            </>
                        ) : saving ? "saving..." : "save changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}