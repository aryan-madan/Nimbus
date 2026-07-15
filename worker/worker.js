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

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const room = url.searchParams.get("room");
        if (!room) return new Response("missing room", { status: 400 });
        if (request.headers.get("Upgrade") !== "websocket") {
            return new Response("expected websocket", { status: 426 });
        }
        const id = env.ROOM.idFromName(room);
        const stub = env.ROOM.get(id);
        return stub.fetch(request);
    }
};