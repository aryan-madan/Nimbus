import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { User } from "firebase/auth";
import Race from "./pages/Race";
import Home from "./pages/Home";
import Board from "./pages/Board";
import Settings from "./pages/Settings";
import { colors } from "./lib/theme";
import { generate } from "./lib/words";
import { iceServers } from "./lib/ice";
import { saveRace, updateElo, load, getProfile, ensureProfile, signIn, signOutUser, watchUser, type Score } from "./lib/fire";

type Screen = "home" | "wait" | "queue" | "found" | "race" | "result" | "board" | "settings";

interface Opponent {
    uid: string;
    name: string;
    elo: number;
}

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
    const [profileName, setProfileNameState] = useState("");
    const [elo, setElo] = useState(1200);
    const [ready, setReady] = useState(false);
    const [rivalReady, setRivalReady] = useState(false);
    const [queueMode, setQueueMode] = useState<"ranked" | "casual" | null>(null);
    const [foundOpponent, setFoundOpponent] = useState<Opponent | null>(null);
    const [foundRanked, setFoundRanked] = useState(false);
    const [eloDelta, setEloDelta] = useState<number | null>(null);

    const room = useRef("");
    const host = useRef(false);
    const sock = useRef<WebSocket | null>(null);
    const peer = useRef<RTCPeerConnection | null>(null);
    const chan = useRef<RTCDataChannel | null>(null);
    const passage = useRef("");
    const start = useRef(0);
    const done = useRef(false);
    const racing = useRef(false);
    const input = useRef<HTMLInputElement>(null);
    const verdictRef = useRef<HTMLHeadingElement>(null);
    const wordRef = useRef<HTMLSpanElement>(null);
    const queueSock = useRef<WebSocket | null>(null);
    const matchedText = useRef<string | null>(null);
    const rankedMode = useRef(false);
    const rankedOpponent = useRef<Opponent | null>(null);
    const eloBefore = useRef(1200);
    const guest = useRef("");

    const joining = new URLSearchParams(location.search).get("room");

    useEffect(() => {
        refresh();
        if (joining) room.current = joining;
        guest.current = crypto.randomUUID();
        const unsub = watchUser(async next => {
            setUser(next);
            if (next) {
                await ensureProfile(next.uid, next.displayName ?? "racer");
                const profile = await getProfile(next.uid);
                setProfileNameState(profile?.name || next.displayName || "");
                setElo(profile?.elo ?? 1200);
            } else {
                setProfileNameState("");
                setElo(1200);
            }
        });
        if (wordRef.current) {
            gsap.fromTo(wordRef.current, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.7, ease: "steps(6)" });
        }
        function handleUnload() {
            if (chan.current?.readyState === "open" && racing.current && !done.current) {
                try { chan.current.send(JSON.stringify({ type: "leave" })); } catch { }
            }
        }
        window.addEventListener("beforeunload", handleUnload);
        return () => {
            unsub();
            window.removeEventListener("beforeunload", handleUnload);
        };
    }, []);

    useEffect(() => {
        if (screen === "result" && verdictRef.current) {
            gsap.fromTo(verdictRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
        }
    }, [screen]);

    async function refresh() {
        setBoard(await load());
    }

    function displayName(): string {
        return user ? (profileName || user.displayName || "racer") : (name || "opponent");
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

    function joinCode(value: string) {
        room.current = value;
        host.current = false;
        history.replaceState(null, "", "?room=" + value);
        setScreen("wait");
        connect();
    }

    function queueRanked() {
        startQueue("ranked");
    }

    function queueCasual() {
        startQueue("casual");
    }

    function startQueue(mode: "ranked" | "casual") {
        const uid = user?.uid || guest.current;
        setQueueMode(mode);
        setEloDelta(null);
        setScreen("queue");
        queueSock.current = new WebSocket(
            worker + "/queue?uid=" + encodeURIComponent(uid) + "&elo=" + elo + "&name=" + encodeURIComponent(displayName()) + "&mode=" + mode
        );
        queueSock.current.onmessage = event => {
            const msg = JSON.parse(event.data);
            if (msg.type === "matched") {
                room.current = msg.room;
                host.current = uid < msg.opponent.uid;
                matchedText.current = msg.text;
                rankedMode.current = mode === "ranked";
                rankedOpponent.current = msg.opponent;
                if (mode === "ranked") eloBefore.current = elo;
                queueSock.current?.close();
                queueSock.current = null;
                setQueueMode(null);
                setFoundOpponent(msg.opponent);
                setFoundRanked(mode === "ranked");
                setScreen("found");
                connect();
            }
        };
    }

    function cancelQueue() {
        queueSock.current?.close();
        queueSock.current = null;
        setQueueMode(null);
        setScreen("home");
    }

    function connect() {
        setRivalName("");
        sock.current = new WebSocket(worker + "?room=" + room.current);
        const conn = new RTCPeerConnection({
            iceServers,
        });
        peer.current = conn;

        conn.onicecandidate = event => {
            if (event.candidate) signal({ type: "candidate", candidate: event.candidate });
        };

        conn.onconnectionstatechange = () => {
            const state = conn.connectionState;
            if ((state === "disconnected" || state === "failed" || state === "closed") && racing.current && !done.current) {
                forfeit();
            }
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
            channel.send(JSON.stringify({ type: "name", name: displayName() }));
            if (host.current) {
                const chosen = matchedText.current || generate();
                matchedText.current = null;
                channel.send(JSON.stringify({ type: "start", text: chosen }));
                begin(chosen);
            }
        };
        channel.onmessage = event => {
            const msg = JSON.parse(event.data);
            if (msg.type === "name") setRivalName(msg.name);
            else if (msg.type === "start") begin(msg.text);
            else if (msg.type === "ready") setRivalReady(true);
            else if (msg.type === "progress") setRival(msg.value);
            else if (msg.type === "finish" && !done.current) announce(false, msg.wpm);
            else if (msg.type === "leave" && !done.current) forfeit();
        };
    }

    function begin(chosen: string) {
        passage.current = chosen;
        setText(chosen);
        setScreen("race");
        start.current = 0;
        done.current = false;
        racing.current = true;
        setTyped("");
        setRival(0);
        setReady(false);
        setRivalReady(false);
        setEloDelta(null);
        setTimeout(() => input.current?.focus(), 50);
    }

    function markReady() {
        setReady(true);
        if (chan.current?.readyState === "open") {
            chan.current.send(JSON.stringify({ type: "ready" }));
        }
    }

    function raceStart() {
        start.current = Date.now();
    }

    function type(value: string) {
        if (!start.current) start.current = Date.now();
        if (value.length < typed.length && value.length < lock(passage.current, typed.length)) return;
        if (value.length > passage.current.length) return;

        setTyped(value);
        const percent = Math.min(100, (value.length / passage.current.length) * 100);
        if (chan.current?.readyState === "open") {
            chan.current.send(JSON.stringify({ type: "progress", value: percent }));
        }
        if (value.length === passage.current.length && value === passage.current && !done.current) finish(value);
    }

    function finish(value: string) {
        done.current = true;
        racing.current = false;
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
            saveRace(user.uid, { wpm, accuracy }).then(refresh).catch(err => console.error("saveRace failed", err));
        }
        announce(true, wpm, accuracy);
    }

    function forfeit() {
        if (!racing.current || done.current) return;
        done.current = true;
        racing.current = false;
        announce(true, 0, undefined, true);
    }

    function announce(win: boolean, wpm: number, accuracy?: number, forfeited = false) {
        done.current = true;
        racing.current = false;
        setScreen("result");
        setVerdict(
            forfeited
                ? "opponent disconnected — you win by forfeit"
                : win
                    ? "you win — " + wpm + "wpm, " + accuracy + "% accuracy"
                    : "rival wins — they hit " + wpm + "wpm first"
        );

        if (rankedMode.current && user && rankedOpponent.current) {
            const before = eloBefore.current;
            const opponent = rankedOpponent.current;
            updateElo(user.uid, opponent.elo, win ? 1 : 0)
                .then(next => {
                    setElo(next);
                    setEloDelta(next - before);
                    refresh();
                })
                .catch(err => console.error("updateElo failed", err));
        } else {
            setEloDelta(null);
        }
    }

    function leaveRace() {
        if (chan.current?.readyState === "open" && racing.current && !done.current) {
            try { chan.current.send(JSON.stringify({ type: "leave" })); } catch { }
        }
        done.current = true;
        racing.current = false;
        try { chan.current?.close(); } catch { }
        try { peer.current?.close(); } catch { }
        try { sock.current?.close(); } catch { }
        rankedMode.current = false;
        rankedOpponent.current = null;
        setReady(false);
        setRivalReady(false);
        setEloDelta(null);
        setScreen("home");
    }

    function rematch() {
        rankedMode.current = false;
        rankedOpponent.current = null;
        const chosen = generate();
        if (chan.current?.readyState === "open") {
            chan.current.send(JSON.stringify({ type: "start", text: chosen }));
        }
        begin(chosen);
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

    function openSettings() {
        setScreen("settings");
    }

    function closeSettings() {
        setScreen("home");
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.bg, color: colors.text }}>
            <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-between border-b px-6 py-4 backdrop-blur sm:px-10" style={{ borderColor: colors.border, backgroundColor: colors.bg + "E6" }}>
                <span className="flex items-center text-base font-medium" style={{ fontFamily: "'JetBrains Mono', monospace", color: colors.text }}>
                    <span ref={wordRef} style={{ display: "inline-block" }}>nimbus</span>
                    <span className="ml-0.5 inline-block h-[1em] w-[0.5ch] translate-y-[0.15em] animate-[blink_1s_step-end_infinite]" style={{ backgroundColor: colors.accent }} />
                </span>
                <div className="flex items-center gap-5">
                    {screen !== "race" && screen !== "board" && screen !== "settings" && (
                        <button
                            onClick={openBoard}
                            className="text-xs font-medium transition-colors duration-150"
                            style={{ color: colors.muted }}
                            onMouseEnter={event => (event.currentTarget.style.color = colors.text)}
                            onMouseLeave={event => (event.currentTarget.style.color = colors.muted)}
                        >
                            leaderboard
                        </button>
                    )}
                    {user && screen !== "race" && screen !== "settings" && (
                        <button
                            onClick={openSettings}
                            className="text-xs font-medium transition-colors duration-150"
                            style={{ color: colors.muted }}
                            onMouseEnter={event => (event.currentTarget.style.color = colors.text)}
                            onMouseLeave={event => (event.currentTarget.style.color = colors.muted)}
                        >
                            settings
                        </button>
                    )}
                    {user ? (
                        <button
                            onClick={signOutUser}
                            className="text-xs transition-colors duration-150"
                            style={{ color: colors.muted }}
                            onMouseEnter={event => (event.currentTarget.style.color = colors.text)}
                            onMouseLeave={event => (event.currentTarget.style.color = colors.muted)}
                        >
                            {profileName || user.displayName || user.email}
                        </button>
                    ) : (
                        <button
                            onClick={signIn}
                            className="text-xs font-medium transition-colors duration-150"
                            style={{ color: colors.text }}
                            onMouseEnter={event => (event.currentTarget.style.color = colors.accent)}
                            onMouseLeave={event => (event.currentTarget.style.color = colors.text)}
                        >
                            sign in
                        </button>
                    )}
                </div>
            </header>

            <div className="relative z-10">
                {(screen === "home" || screen === "wait" || screen === "queue" || screen === "found" || screen === "result") && (
                    <Home
                        stage={screen}
                        name={user ? (profileName || user.displayName || "") : name}
                        setName={setName}
                        locked={!!user}
                        joining={joining}
                        create={create}
                        join={join}
                        joinCode={joinCode}
                        link={link}
                        copied={copied}
                        share={share}
                        board={board}
                        verdict={verdict}
                        verdictRef={verdictRef}
                        again={again}
                        rematch={rematch}
                        signedIn={!!user}
                        elo={elo}
                        queueMode={queueMode}
                        queueRanked={queueRanked}
                        queueCasual={queueCasual}
                        cancelQueue={cancelQueue}
                        foundOpponent={foundOpponent}
                        foundRanked={foundRanked}
                        eloDelta={eloDelta}
                    />
                )}

                {screen === "race" && (
                    <Race
                        text={text}
                        typed={typed}
                        rival={rival}
                        rivalName={rivalName}
                        ready={ready}
                        rivalReady={rivalReady}
                        input={input}
                        type={type}
                        onReady={markReady}
                        rematch={rematch}
                        start={raceStart}
                        leave={leaveRace}
                        ranked={rankedMode.current}
                        eloChange={eloDelta ?? undefined}
                    />
                )}

                {screen === "board" && <Board board={board} back={closeBoard} />}

                {screen === "settings" && user && <Settings user={user} back={closeSettings} />}
            </div>
        </div>
    );
}