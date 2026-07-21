import { useSyncExternalStore } from "react";

export const mono = { fontFamily: "'JetBrains Mono', monospace" };

export interface Theme {
    bg: string;
    panel: string;
    border: string;
    text: string;
    muted: string;
    faint: string;
    accent: string;
    rival: string;
    error: string;
}

export const themes: Record<string, Theme> = {
    nimbus: {
        bg: "#121110",
        panel: "#1B1918",
        border: "#2C2A27",
        text: "#F2EEE6",
        muted: "#6F6A5F",
        faint: "#3E3B36",
        accent: "#4EA8FF",
        rival: "#FF9F5D",
        error: "#FF5B54"
    },
    dracula: {
        bg: "#282A36",
        panel: "#2F3241",
        border: "#44475A",
        text: "#F8F8F2",
        muted: "#8890B0",
        faint: "#44475A",
        accent: "#BD93F9",
        rival: "#FF79C6",
        error: "#FF5555"
    },
    nord: {
        bg: "#2E3440",
        panel: "#3B4252",
        border: "#434C5E",
        text: "#ECEFF4",
        muted: "#8792A8",
        faint: "#4C566A",
        accent: "#88C0D0",
        rival: "#D08770",
        error: "#BF616A"
    },
    gruvbox: {
        bg: "#1D2021",
        panel: "#282828",
        border: "#3C3836",
        text: "#EBDBB2",
        muted: "#928374",
        faint: "#504945",
        accent: "#FE8019",
        rival: "#B8BB26",
        error: "#FB4934"
    },
    solarized: {
        bg: "#002B36",
        panel: "#073642",
        border: "#0B4A5A",
        text: "#EEE8D5",
        muted: "#657B83",
        faint: "#0E5A6E",
        accent: "#268BD2",
        rival: "#CB4B16",
        error: "#DC322F"
    },
    rosepine: {
        bg: "#191724",
        panel: "#1F1D2E",
        border: "#26233A",
        text: "#E0DEF4",
        muted: "#6E6A86",
        faint: "#403D52",
        accent: "#C4A7E7",
        rival: "#EBBCBA",
        error: "#EB6F92"
    },
    paper: {
        bg: "#F5F1E8",
        panel: "#EDE7D9",
        border: "#D8D0BC",
        text: "#2B2822",
        muted: "#8A8272",
        faint: "#C9C0A9",
        accent: "#2563EB",
        rival: "#B45309",
        error: "#DC2626"
    },
    matrix: {
        bg: "#0A0E0A",
        panel: "#111811",
        border: "#1E2E1E",
        text: "#D7FFD9",
        muted: "#4C8C55",
        faint: "#254025",
        accent: "#39FF6A",
        rival: "#FFD23F",
        error: "#FF4C4C"
    }
};

export type ThemeName = keyof typeof themes;

const KEY = "nimbus-theme";

function readStored(): ThemeName {
    const stored = localStorage.getItem(KEY);
    return stored && stored in themes ? (stored as ThemeName) : "nimbus";
}

function applyBodyBg(name: ThemeName) {
    const bg = themes[name].bg;
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
}

let current: ThemeName = readStored();
const listeners = new Set<() => void>();

if (typeof document !== "undefined") {
    applyBodyBg(current);
}

export function getThemeName(): ThemeName {
    return current;
}

export function setThemeName(name: ThemeName) {
    current = name;
    localStorage.setItem(KEY, name);
    colors = themes[current];
    applyBodyBg(current);
    listeners.forEach(fn => fn());
}

function subscribeTheme(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

export let colors: Theme = themes[current];

export function useTheme() {
    const name = useSyncExternalStore(subscribeTheme, getThemeName);
    return { name, colors: themes[name], names: Object.keys(themes) as ThemeName[] };
}