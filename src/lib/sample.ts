import { initializeApp } from "firebase/app";
import {
    getFirestore, collection, doc, getDoc, setDoc, runTransaction, query, orderBy, limit, getDocs, serverTimestamp
} from "firebase/firestore";
import {
    getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User
} from "firebase/auth";
import { expected, update } from "./elo";

const config = {
    // put your config here
};

const app = initializeApp(config);
export const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export interface Score {
    name: string;
    wpm: number;
    accuracy: number;
    races: number;
    elo?: number;
}

export interface Run {
    wpm: number;
    accuracy: number;
}

export interface Profile {
    name: string;
    wpm: number;
    accuracy: number;
    races: number;
    elo: number;
}

export async function ensureProfile(uid: string, fallback: string) {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        await setDoc(ref, {
            name: fallback.trim().slice(0, 16) || "racer",
            wpm: 0,
            accuracy: 0,
            races: 0,
            elo: 1200,
            updatedAt: serverTimestamp()
        });
    }
}

export async function getProfileName(uid: string): Promise<string> {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (snap.exists() && typeof snap.data().name === "string") return snap.data().name;
    return "";
}

export async function getProfile(uid: string): Promise<Profile | null> {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
        name: typeof data.name === "string" ? data.name : "",
        wpm: typeof data.wpm === "number" ? data.wpm : 0,
        accuracy: typeof data.accuracy === "number" ? data.accuracy : 0,
        races: typeof data.races === "number" ? data.races : 0,
        elo: typeof data.elo === "number" ? data.elo : 1200
    };
}

export async function setProfileName(uid: string, name: string) {
    const trimmed = name.trim().slice(0, 16);
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, { name: trimmed, updatedAt: serverTimestamp() }, { merge: true });
    const boardRef = doc(db, "board", uid);
    const boardSnap = await getDoc(boardRef);
    if (boardSnap.exists()) {
        await setDoc(boardRef, { ...boardSnap.data(), name: trimmed }, { merge: false });
    }
}

export async function saveRace(uid: string, run: Run) {
    const boardRef = doc(db, "board", uid);
    const userRef = doc(db, "users", uid);
    const name = await getProfileName(uid);
    await runTransaction(db, async transaction => {
        const existing = await transaction.get(boardRef);
        const userSnap = await transaction.get(userRef);
        const priorRaces = userSnap.exists() && typeof userSnap.data().races === "number" ? userSnap.data().races : 0;
        const priorAcc = userSnap.exists() && typeof userSnap.data().accuracy === "number" ? userSnap.data().accuracy : 0;
        const races = priorRaces + 1;
        const avgAcc = Math.round((priorAcc * priorRaces + run.accuracy) / races);
        const elo = userSnap.exists() && typeof userSnap.data().elo === "number" ? userSnap.data().elo : 1200;

        if (!existing.exists()) {
            transaction.set(boardRef, { name, wpm: run.wpm, accuracy: avgAcc, races, elo, time: serverTimestamp() });
            transaction.set(userRef, { name, wpm: run.wpm, accuracy: avgAcc, races, elo, updatedAt: serverTimestamp() }, { merge: true });
            return;
        }

        const data = existing.data();
        const better = run.wpm > data.wpm;

        transaction.set(boardRef, {
            name: data.name,
            wpm: better ? run.wpm : data.wpm,
            accuracy: avgAcc,
            races,
            elo,
            time: better ? serverTimestamp() : data.time
        });

        transaction.set(userRef, {
            name: data.name,
            wpm: better ? run.wpm : (userSnap.exists() ? userSnap.data().wpm : run.wpm),
            accuracy: avgAcc,
            races,
            elo,
            updatedAt: serverTimestamp()
        }, { merge: true });
    });
}

export async function updateElo(uid: string, oppElo: number, score: number) {
    const userRef = doc(db, "users", uid);
    const boardRef = doc(db, "board", uid);
    let next = 1200;
    await runTransaction(db, async transaction => {
        const userSnap = await transaction.get(userRef);
        const boardSnap = await transaction.get(boardRef);

        const elo = userSnap.exists() && typeof userSnap.data().elo === "number" ? userSnap.data().elo : 1200;
        const exp = expected(elo, oppElo);
        next = update(elo, exp, score);

        transaction.set(userRef, { elo: next, updatedAt: serverTimestamp() }, { merge: true });

        if (boardSnap.exists()) {
            transaction.set(boardRef, { ...boardSnap.data(), elo: next }, { merge: false });
        }
    });
    return next;
}

export async function load(): Promise<Score[]> {
    const rows = await getDocs(query(collection(db, "board"), orderBy("wpm", "desc"), limit(10)));
    return rows.docs.map(row => row.data() as Score);
}

export function watchUser(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
}

export async function signIn() {
    const result = await signInWithPopup(auth, provider);
    await ensureProfile(result.user.uid, result.user.displayName ?? "racer");
    return result.user;
}

export async function signOutUser() {
    await signOut(auth);
}