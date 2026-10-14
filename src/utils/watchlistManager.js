import { auth, firestoreDb } from "../components/firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  doc,
} from "firebase/firestore";

const WATCHLIST_KEY = "watchlist";

/**
 * Safely retrieve the local watchlist from localStorage.
 * Handles corrupted, non-JSON, and non-array data gracefully by returning an empty array.
 */
export const getLocalWatchlist = () => {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return [];
    }
    const raw = window.localStorage.getItem(WATCHLIST_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn("Corrupted watchlist data in localStorage (expected array). Resetting.");
      setLocalWatchlist([]);
      return [];
    }

    // Filter out invalid items (null, non-objects, or items without symbol)
    return parsed.filter(
      (item) => item && typeof item === "object" && typeof item.symbol === "string"
    );
  } catch (error) {
    console.error("Failed to parse watchlist from localStorage. Falling back to empty watchlist.", error);
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(WATCHLIST_KEY, JSON.stringify([]));
      }
    } catch {
      // Ignore write errors (e.g., storage quota or disabled)
    }
    return [];
  }
};

/**
 * Safely persist the watchlist array to localStorage.
 */
export const setLocalWatchlist = (list) => {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    const safeList = Array.isArray(list) ? list : [];
    window.localStorage.setItem(WATCHLIST_KEY, JSON.stringify(safeList));
  } catch (error) {
    console.error("Failed to save watchlist to localStorage:", error);
  }
};

/**
 * Safely remove the local watchlist from localStorage.
 */
export const clearLocalWatchlist = () => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(WATCHLIST_KEY);
    }
  } catch (error) {
    console.error("Failed to clear local watchlist from localStorage:", error);
  }
};

export const toggleWatchlist = async (stock) => {
  if (!stock || !stock.symbol) return;
  const user = auth.currentUser;

  if (user) {
    const q = query(
      collection(firestoreDb, "watchlist"),
      where("uid", "==", user.uid),
      where("symbol", "==", stock.symbol)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      await Promise.all(
        snapshot.docs.map((docSnap) =>
          deleteDoc(doc(firestoreDb, "watchlist", docSnap.id))
        )
      );
    } else {
      await addDoc(collection(firestoreDb, "watchlist"), {
        uid: user.uid,
        symbol: stock.symbol,
        name: stock.name,
      });
    }
  } else {
    const stored = getLocalWatchlist();
    const exists = stored.find((s) => s.symbol === stock.symbol);

    if (exists) {
      const updated = stored.filter((s) => s.symbol !== stock.symbol);
      setLocalWatchlist(updated);
    } else {
      setLocalWatchlist([...stored, stock]);
    }
  }
};

export const getWatchlistSymbols = async () => {
  const user = auth.currentUser;

  if (user) {
    const q = query(collection(firestoreDb, "watchlist"), where("uid", "==", user.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data().symbol);
  } else {
    const stored = getLocalWatchlist();
    return stored.map((stock) => stock.symbol);
  }
};

export const syncLocalToFirebase = async (passedUser) => {
  const user = passedUser || auth.currentUser;

  if (!user) return;

  const localWatchlist = getLocalWatchlist();

  const q = query(
    collection(firestoreDb, "watchlist"),
    where("uid", "==", user.uid)
  );
  const snapshot = await getDocs(q);
  const firebaseSymbols = snapshot.docs.map((doc) => doc.data().symbol);

  const newItems = localWatchlist.filter(
    (item) => !firebaseSymbols.includes(item.symbol)
  );

  for (const stock of newItems) {
    await addDoc(collection(firestoreDb, "watchlist"), {
      uid: user.uid,
      symbol: stock.symbol,
      name: stock.name,
    });
  }

  clearLocalWatchlist();
};

export const getWatchlist = async () => {
  const user = auth.currentUser;

  if (user) {
    const q = query(collection(firestoreDb, "watchlist"), where("uid", "==", user.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  } else {
    return getLocalWatchlist();
  }
};

export const removeStockFromWatchlist = async (symbol) => {
  const user = auth.currentUser;

  if (user) {
    const q = query(
      collection(firestoreDb, "watchlist"),
      where("uid", "==", user.uid),
      where("symbol", "==", symbol)
    );
    const snapshot = await getDocs(q);

    await Promise.all(
      snapshot.docs.map((docSnap) =>
        deleteDoc(doc(firestoreDb, "watchlist", docSnap.id))
      )
    );
  } else {
    const stored = getLocalWatchlist();
    const updated = stored.filter((s) => s.symbol !== symbol);
    setLocalWatchlist(updated);
  }
};
