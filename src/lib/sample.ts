import { initializeApp } from "firebase/app";
import {
    getFirestore, collection, doc, getDoc, setDoc, query, orderBy, limit, getDocs, serverTimestamp
} from "firebase/firestore";
import {
    getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User
} from "firebase/auth";

const config = {

};

const app = initializeApp(config);
export const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export interface Score {
    name: string;
    wpm: number;
    accuracy: number;
}

export async function save(uid: string, score: Score) {
    const ref = doc(db, "board", uid);
    const existing = await getDoc(ref);
    if (!existing.exists() || existing.data().wpm < score.wpm) {
        await setDoc(ref, { ...score, time: serverTimestamp() });
    }
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
    return result.user;
}

export async function signOutUser() {
    await signOut(auth);
}