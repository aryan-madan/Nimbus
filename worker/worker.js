import { generate } from "./words.js";

function code() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export class Room {
    constructor(state) {
        this.state = state;
        this.socks = [];
    }

    async fetch(request) {
        const pair = new WebSocketPair();
        const client = pair[0];
        const server = pair[1];
        server.accept();

        for (const sock of this.socks) {
            sock.send(JSON.stringify({ type: "peer" }));
        }
        this.socks.push(server);

        server.addEventListener("message", event => {
            for (const sock of this.socks) {
                if (sock !== server) sock.send(event.data);
            }
        });

        server.addEventListener("close", () => {
            this.socks = this.socks.filter(sock => sock !== server);
        });

        return new Response(null, { status: 101, webSocket: client });
    }
}

export class Queue {
    constructor(state) {
        this.state = state;
        this.ranked = [];
        this.casual = [];
    }

    async fetch(request) {
        const url = new URL(request.url);
        const uid = url.searchParams.get("uid");
        const name = url.searchParams.get("name") || "racer";
        const elo = Number(url.searchParams.get("elo")) || 1200;
        const mode = url.searchParams.get("mode") === "ranked" ? "ranked" : "casual";

        if (!uid) return new Response("missing uid", { status: 400 });

        const pair = new WebSocketPair();
        const client = pair[0];
        const server = pair[1];
        server.accept();

        const entry = { uid, name, elo, sock: server, joined: Date.now() };
        const pool = mode === "ranked" ? this.ranked : this.casual;
        pool.push(entry);

        server.addEventListener("close", () => {
            this.ranked = this.ranked.filter(w => w.sock !== server);
            this.casual = this.casual.filter(w => w.sock !== server);
        });

        this.matchRanked();
        this.matchCasual();

        if (this.ranked.length > 0 || this.casual.length > 0) {
            await this.state.storage.setAlarm(Date.now() + 1000);
        }

        return new Response(null, { status: 101, webSocket: client });
    }

    async alarm() {
        this.matchRanked();
        this.matchCasual();
        if (this.ranked.length > 0 || this.casual.length > 0) {
            await this.state.storage.setAlarm(Date.now() + 1000);
        }
    }

    radius(entry) {
        const waited = (Date.now() - entry.joined) / 1000;
        return Math.min(400, 50 + waited * 15);
    }

    matchRanked() {
        let again = true;
        while (again) {
            again = false;
            for (let i = 0; i < this.ranked.length; i++) {
                const a = this.ranked[i];
                let best = -1;
                let bestGap = Infinity;

                for (let j = 0; j < this.ranked.length; j++) {
                    if (i === j) continue;
                    const b = this.ranked[j];
                    const gap = Math.abs(a.elo - b.elo);
                    const allowed = Math.max(this.radius(a), this.radius(b));
                    if (gap <= allowed && gap < bestGap) {
                        best = j;
                        bestGap = gap;
                    }
                }

                if (best !== -1) {
                    const b = this.ranked[best];
                    this.pair(a, b, "ranked");
                    this.ranked = this.ranked.filter(w => w !== a && w !== b);
                    again = true;
                    break;
                }
            }
        }
    }

    matchCasual() {
        while (this.casual.length >= 2) {
            const a = this.casual.shift();
            const b = this.casual.shift();
            this.pair(a, b, "casual");
        }
    }

    pair(a, b, mode) {
        const room = code();
        const text = generate();
        a.sock.send(JSON.stringify({ type: "matched", mode, room, text, opponent: { uid: b.uid, name: b.name, elo: b.elo } }));
        b.sock.send(JSON.stringify({ type: "matched", mode, room, text, opponent: { uid: a.uid, name: a.name, elo: a.elo } }));
    }
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (request.headers.get("Upgrade") !== "websocket") {
            return new Response("expected websocket", { status: 426 });
        }

        if (url.pathname === "/queue") {
            const id = env.QUEUE.idFromName("global");
            const stub = env.QUEUE.get(id);
            return stub.fetch(request);
        }

        const room = url.searchParams.get("room");
        if (!room) return new Response("missing room", { status: 400 });
        const id = env.ROOM.idFromName(room);
        const stub = env.ROOM.get(id);
        return stub.fetch(request);
    }
};