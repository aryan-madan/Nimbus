import { useEffect, useState } from "react";
import { ArrowLeft, ChevronUp } from "lucide-react";
import { mono, useTheme, setThemeName, type ThemeName } from "../lib/theme";
import { getProfile, setProfileName } from "../lib/fire";
import { type User } from "firebase/auth";

interface Props {
    user: User;
    back: () => void;
}

const previewMap: Record<string, { bg: string; accent: string }> = {
    nimbus: { bg: "#121110", accent: "#4EA8FF" },
    dracula: { bg: "#282A36", accent: "#BD93F9" },
    nord: { bg: "#2E3440", accent: "#88C0D0" },
    gruvbox: { bg: "#1D2021", accent: "#FE8019" },
    solarized: { bg: "#002B36", accent: "#268BD2" },
    rosepine: { bg: "#191724", accent: "#C4A7E7" },
    paper: { bg: "#F5F1E8", accent: "#2563EB" },
    matrix: { bg: "#0A0E0A", accent: "#39FF6A" }
};

function themePreview(name: string) {
    return previewMap[name] ?? previewMap.nimbus;
}

function Swatch({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
    const preview = themePreview(name);
    const dims = size === "sm" ? "h-3.5 w-5" : "h-4 w-6";
    return (
        <span className={"flex overflow-hidden rounded-[4px] " + dims}>
            <span className="h-full w-1/2" style={{ backgroundColor: preview.bg }} />
            <span className="h-full w-1/2" style={{ backgroundColor: preview.accent }} />
        </span>
    );
}

export default function Settings({ user, back }: Props) {
    const { colors, name: themeName, names } = useTheme();
    const [name, setName] = useState("");
    const [saved, setSaved] = useState("");
    const [busy, setBusy] = useState(false);
    const [wpm, setWpm] = useState(0);
    const [acc, setAcc] = useState(0);
    const [races, setRaces] = useState(0);
    const [open, setOpen] = useState(false);
    const [show, setShow] = useState(false);

    useEffect(() => {
        const raf = requestAnimationFrame(() => setShow(true));
        getProfile(user.uid).then(profile => {
            const value = profile?.name || user.displayName || "";
            setName(value);
            setSaved(value);
            setWpm(profile?.wpm ?? 0);
            setAcc(profile?.accuracy ?? 0);
            setRaces(profile?.races ?? 0);
        });
        return () => cancelAnimationFrame(raf);
    }, [user]);

    useEffect(() => {
        function onClick(event: MouseEvent) {
            const target = event.target as HTMLElement;
            if (!target.closest("[data-theme-dropdown]")) setOpen(false);
        }
        function onKey(event: KeyboardEvent) {
            if (event.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, []);

    const dirty = name.trim() !== saved.trim() && name.trim().length > 0;

    async function save() {
        setBusy(true);
        await setProfileName(user.uid, name);
        setSaved(name.trim());
        setBusy(false);
    }

    function pick(nameOption: ThemeName) {
        setThemeName(nameOption);
        setOpen(false);
    }

    const enterClass = "transition-all duration-500 ease-out " + (show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2");
    function delay(i: number): React.CSSProperties {
        return { transitionDelay: show ? `${i * 60}ms` : "0ms" };
    }

    return (
        <div className="flex min-h-screen w-full flex-col items-center px-6 pb-16 pt-32">
            <div className="flex w-full max-w-md flex-col items-center gap-8">
                <div className={enterClass + " flex w-full items-center"} style={delay(0)}>
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

                <div className={enterClass + " flex flex-col items-center gap-2 text-center"} style={delay(1)}>
                    <h1 className="text-2xl font-medium" style={{ color: colors.text }}>settings</h1>
                    <span className="text-xs" style={{ color: colors.muted }}>{user.email}</span>
                </div>

                <div className={enterClass + " flex w-full flex-col overflow-hidden rounded-2xl border"} style={{ ...delay(2), borderColor: colors.border, backgroundColor: colors.panel }}>
                    <div className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide" style={{ color: colors.muted }}>
                        stats
                    </div>
                    <div className="h-px w-full" style={{ backgroundColor: colors.border }} />
                    <div className="flex items-center justify-around px-4 py-4 text-xs" style={{ ...mono, color: colors.muted }}>
                        <span>best <span style={{ color: colors.text }}>{wpm}wpm</span></span>
                        <span>acc <span style={{ color: colors.text }}>{acc}%</span></span>
                        <span>races <span style={{ color: colors.text }}>{races}</span></span>
                    </div>
                </div>

                <div className={enterClass + " flex w-full flex-col overflow-hidden rounded-2xl border"} style={{ ...delay(3), borderColor: colors.border, backgroundColor: colors.panel }}>
                    <div className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide" style={{ color: colors.muted }}>
                        profile
                    </div>
                    <div className="h-px w-full" style={{ backgroundColor: colors.border }} />
                    <div className="flex flex-col gap-3 px-4 py-4">
                        <input
                            value={name}
                            onChange={event => setName(event.target.value.slice(0, 16))}
                            maxLength={16}
                            placeholder="your name"
                            className="w-full border-b bg-transparent py-2 text-sm outline-none transition-colors duration-150"
                            style={{ borderColor: colors.border, color: colors.text }}
                            onFocus={event => (event.currentTarget.style.borderColor = colors.accent)}
                            onBlur={event => (event.currentTarget.style.borderColor = colors.border)}
                        />
                        <div className="flex items-center justify-between text-[10px]" style={{ ...mono, color: colors.muted }}>
                            <span>{name.length}/16</span>
                            <span>changing this won't affect your rank</span>
                        </div>
                        <button
                            onClick={save}
                            disabled={busy || !dirty}
                            className="mt-1 w-full rounded-2xl py-3 text-sm font-medium transition-all duration-150 hover:opacity-90 active:scale-[0.98] active:opacity-80 disabled:opacity-30"
                            style={{ backgroundColor: colors.accent, color: colors.bg }}
                        >
                            {busy ? "saving..." : dirty ? "save" : "saved"}
                        </button>
                    </div>
                </div>

                <div
                    data-theme-dropdown
                    className={enterClass + " relative flex w-full flex-col overflow-visible rounded-2xl border"}
                    style={{ ...delay(4), borderColor: colors.border, backgroundColor: colors.panel }}
                >
                    <div className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide" style={{ color: colors.muted }}>
                        appearance
                    </div>
                    <div className="h-px w-full" style={{ backgroundColor: colors.border }} />
                    <div className="relative px-4 py-4">
                        <button
                            onClick={() => setOpen(value => !value)}
                            className="flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm transition-colors duration-150"
                            style={{ borderColor: open ? colors.accent : colors.border, backgroundColor: colors.bg, color: colors.text }}
                        >
                            <span className="flex items-center gap-3">
                                <Swatch name={themeName} />
                                {themeName}
                            </span>
                            <ChevronUp
                                size={14}
                                style={{ color: colors.muted, transform: open ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 150ms" }}
                            />
                        </button>

                        {open && (
                            <div
                                className="absolute bottom-full left-4 right-4 z-30 mb-1.5 max-h-64 overflow-y-auto rounded-2xl border py-1 shadow-lg"
                                style={{ borderColor: colors.border, backgroundColor: colors.bg }}
                            >
                                {names.map(nameOption => {
                                    const active = nameOption === themeName;
                                    return (
                                        <button
                                            key={nameOption}
                                            onClick={() => pick(nameOption as ThemeName)}
                                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors duration-100"
                                            style={{ color: active ? colors.text : colors.muted, backgroundColor: "transparent" }}
                                            onMouseEnter={event => (event.currentTarget.style.backgroundColor = colors.panel)}
                                            onMouseLeave={event => (event.currentTarget.style.backgroundColor = "transparent")}
                                        >
                                            <Swatch name={nameOption} size="sm" />
                                            {nameOption}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}