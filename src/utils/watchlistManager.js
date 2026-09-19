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

export const toggleWatchlist = async (stock) => {
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
    const stored = JSON.parse(localStorage.getItem("watchlist")) || [];
    const exists = stored.find((s) => s.symbol === stock.symbol);

    if (exists) {
      const updated = stored.filter((s) => s.symbol !== stock.symbol);
      localStorage.setItem("watchlist", JSON.stringify(updated));
    } else {
      localStorage.setItem("watchlist", JSON.stringify([...stored, stock]));
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
    const stored = JSON.parse(localStorage.getItem("watchlist")) || [];
    return stored.map((stock) => stock.symbol);
  }
};

export const syncLocalToFirebase = async () => {
  const user = auth.currentUser;

  if (!user) return;

  const localWatchlist = JSON.parse(localStorage.getItem("watchlist")) || [];

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

  localStorage.removeItem("watchlist");
};

export const getWatchlist = async () => {
  const user = auth.currentUser;

  if (user) {
    const q = query(collection(firestoreDb, "watchlist"), where("uid", "==", user.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  } else {
    const stored = JSON.parse(localStorage.getItem("watchlist")) || [];
    return stored;
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
    const stored = JSON.parse(localStorage.getItem("watchlist")) || [];
    const updated = stored.filter((s) => s.symbol !== symbol);
    localStorage.setItem("watchlist", JSON.stringify(updated));
  }
};
