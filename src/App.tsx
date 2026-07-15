import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { User } from "firebase/auth";
import Race from "./pages/Race";
import Home from "./pages/Home";
import Board from "./pages/Board";
import { save, load, signIn, signOutUser, watchUser, type Score } from "./lib/fire";

type Screen = "home" | "wait" | "race" | "result" | "board";

const bank = [
    "the quick brown fox jumps over the lazy dog and runs across the field",
    "practice does not make perfect practice makes permanent so practice correctly",
    "typing fast means nothing if your fingers forget where the letters live",
    "a calm mind types faster than a hurried one every single time",
    "speed comes from rhythm not from rushing every single key you press",
    "the sky above the city turned orange just before the storm arrived",
    "good habits compound slowly but bad habits compound just as fast"
];

const worker = "wss://nimbus.aryanmadan.workers.dev";

function code(): string {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function lock(passage: string, length: number): number {
    const cut = passage.slice(0, length).lastIndexOf(" ");
    return cut === -1 ? 0 : cut + 1;
}

export default function App() {
    const [screen, setScreen] = useState<Screen>("home");
    const [name, setName] = useState("");
    const [link, setLink] = useState("");
    const [text, setText] = useState("");
    const [typed, setTyped] = useState("");
    const [rival, setRival] = useState(0);
    const [rivalName, setRivalName] = useState("");
    const [verdict, setVerdict] = useState("");
    const [board, setBoard] = useState<Score[]>([]);
    const [copied, setCopied] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    const room = useRef("");
    const host = useRef(false);
    const sock = useRef<WebSocket | null>(null);
    const peer = useRef<RTCPeerConnection | null>(null);
    const chan = useRef<RTCDataChannel | null>(null);
    const passage = useRef("");
    const start = useRef(0);
    const done = useRef(false);
    const input = useRef<HTMLInputElement>(null);
    const verdictRef = useRef<HTMLHeadingElement>(null);
    const wordRef = useRef<HTMLSpanElement>(null);

    const joining = new URLSearchParams(location.search).get("room");

    useEffect(() => {
        refresh();
        if (joining) room.current = joining;
        const unsub = watchUser(setUser);
        if (wordRef.current) {
            gsap.fromTo(wordRef.current, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.7, ease: "steps(6)" });
        }
        return unsub;
    }, []);

    useEffect(() => {
        if (screen === "result" && verdictRef.current) {
            gsap.fromTo(verdictRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
        }
    }, [screen]);

    async function refresh() {
        setBoard(await load());
    }

    function create() {
        room.current = code();
        host.current = true;
        history.replaceState(null, "", "?room=" + room.current);
        setLink(location.href);
        setScreen("wait");
        connect();
    }

    function join() {
        host.current = false;
        setScreen("wait");
        connect();
    }

    function joinByCode(value: string) {
        room.current = value;
        host.current = false;
        history.replaceState(null, "", "?room=" + value);
        setScreen("wait");
        connect();
    }

    function connect() {
        setRivalName("");
        sock.current = new WebSocket(worker + "?room=" + room.current);
        const conn = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        peer.current = conn;

        conn.onicecandidate = event => {
            if (event.candidate) signal({ type: "candidate", candidate: event.candidate });
        };

        if (host.current) {
            chan.current = conn.createDataChannel("race");
            wire();
        } else {
            conn.ondatachannel = event => {
                chan.current = event.channel;
                wire();
            };
        }

        sock.current.onmessage = async event => {
            const msg = JSON.parse(event.data);

            if (msg.type === "peer" && host.current) {
                const offer = await conn.createOffer();
                await conn.setLocalDescription(offer);
                signal({ type: "offer", sdp: offer });
            } else if (msg.type === "offer" && !host.current) {
                await conn.setRemoteDescription(msg.sdp);
                const answer = await conn.createAnswer();
                await conn.setLocalDescription(answer);
                signal({ type: "answer", sdp: answer });
            } else if (msg.type === "answer" && host.current) {
                await conn.setRemoteDescription(msg.sdp);
            } else if (msg.type === "candidate") {
                try { await conn.addIceCandidate(msg.candidate); } catch { }
            }
        };
    }

    function signal(msg: unknown) {
        if (sock.current && sock.current.readyState === WebSocket.OPEN) {
            sock.current.send(JSON.stringify(msg));
        }
    }

    function wire() {
        const channel = chan.current!;
        channel.onopen = () => {
            channel.send(JSON.stringify({ type: "name", name: user?.displayName ?? (name || "opponent") }));
            if (host.current) {
                const chosen = bank[Math.floor(Math.random() * bank.length)];
                channel.send(JSON.stringify({ type: "start", text: chosen }));
                begin(chosen);
            }
        };
        channel.onmessage = event => {
            const msg = JSON.parse(event.data);
            if (msg.type === "name") setRivalName(msg.name);
            else if (msg.type === "start" && !host.current) begin(msg.text);
            else if (msg.type === "progress") setRival(msg.value);
            else if (msg.type === "finish" && !done.current) announce(false, msg.wpm);
        };
    }

    function begin(chosen: string) {
        passage.current = chosen;
        setText(chosen);
        setScreen("race");
        start.current = Date.now();
        done.current = false;
        setTyped("");
        setRival(0);
        setTimeout(() => input.current?.focus(), 50);
    }

    function type(value: string) {
        if (value.length < typed.length && value.length < lock(passage.current, typed.length)) return;

        setTyped(value);
        const percent = Math.min(100, (value.length / passage.current.length) * 100);
        if (chan.current?.readyState === "open") {
            chan.current.send(JSON.stringify({ type: "progress", value: percent }));
        }
        if (value.length === passage.current.length && !done.current) finish(value);
    }

    function finish(value: string) {
        done.current = true;
        const minutes = (Date.now() - start.current) / 60000;
        const count = passage.current.trim().split(/\s+/).length;
        const wpm = Math.round(count / minutes);

        let errors = 0;
        for (let i = 0; i < value.length; i++) if (value[i] !== passage.current[i]) errors++;
        const accuracy = Math.round(((value.length - errors) / value.length) * 100);

        if (chan.current?.readyState === "open") {
            chan.current.send(JSON.stringify({ type: "finish", wpm }));
        }
        if (user) {
            save(user.uid, { name: user.displayName ?? name ?? "Racer", wpm, accuracy }).then(refresh);
        }
        announce(true, wpm, accuracy);
    }

    function announce(win: boolean, wpm: number, accuracy?: number) {
        done.current = true;
        setScreen("result");
        setVerdict(win ? "you win — " + wpm + "wpm, " + accuracy + "% accuracy" : "rival wins — they hit " + wpm + "wpm first");
    }

    function share() {
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    function again() {
        location.href = location.origin + location.pathname;
    }

    function openBoard() {
        setScreen("board");
    }

    function closeBoard() {
        setScreen("home");
    }

    return (
        <div className="min-h-screen bg-[#121110] text-[#F2EEE6]">
            <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-between border-b border-[#2C2A27] bg-[#121110]/90 px-6 py-4 backdrop-blur sm:px-10">
                <span className="flex items-center text-base font-medium text-[#F2EEE6]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    <span ref={wordRef} style={{ display: "inline-block" }}>nimbus</span>
                    <span className="ml-0.5 inline-block h-[1em] w-[0.5ch] translate-y-[0.15em] animate-[blink_1s_step-end_infinite] bg-[#D6FF3D]" />
                </span>
                <div className="flex items-center gap-5">
                    {screen !== "race" && screen !== "board" && (
                        <button onClick={openBoard} className="text-xs font-medium text-[#6F6A5F] transition-colors duration-150 hover:text-[#F2EEE6]">
                            leaderboard
                        </button>
                    )}
                    {user ? (
                        <button onClick={signOutUser} className="text-xs text-[#6F6A5F] transition-colors duration-150 hover:text-[#F2EEE6]">
                            {user.displayName ?? user.email}
                        </button>
                    ) : (
                        <button onClick={signIn} className="text-xs font-medium text-[#F2EEE6] transition-colors duration-150 hover:text-[#D6FF3D]">
                            sign in
                        </button>
                    )}
                </div>
            </header>

            <div className="relative z-10">
                {(screen === "home" || screen === "wait" || screen === "result") && (
                    <Home
                        stage={screen}
                        name={name}
                        onName={setName}
                        joining={joining}
                        onCreate={create}
                        onJoin={join}
                        onJoinByCode={joinByCode}
                        link={link}
                        copied={copied}
                        onShare={share}
                        board={board}
                        verdict={verdict}
                        verdictRef={verdictRef}
                        onAgain={again}
                    />
                )}

                {screen === "race" && <Race text={text} typed={typed} rival={rival} rivalName={rivalName} inputRef={input} onType={type} />}

                {screen === "board" && <Board board={board} onBack={closeBoard} />}
            </div>
        </div>
    );
}