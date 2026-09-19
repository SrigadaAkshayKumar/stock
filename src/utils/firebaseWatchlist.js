import { getFirestore, doc, getDoc, setDoc, updateDoc } from "../components/firebase";

const db = getFirestore();

export const addToWatchlist = async (userId, stock) => {
  const docRef = doc(db, 'watchlists', userId);
  const docSnap = await getDoc(docRef);
  let currentList = [];

  if (docSnap.exists()) {
    currentList = docSnap.data().stocks || [];
  }

  const alreadyAdded = currentList.find((s) => s.symbol === stock.symbol);
  if (!alreadyAdded) {
    currentList.push(stock);
    await setDoc(docRef, { stocks: currentList });
  }
};

export const removeFromWatchlist = async (userId, symbol) => {
  const docRef = doc(db, 'watchlists', userId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return;

  const currentList = docSnap.data().stocks || [];
  const updatedList = currentList.filter((s) => s.symbol !== symbol);
  await updateDoc(docRef, { stocks: updatedList });
};

export const getUserWatchlist = async (userId) => {
  const docRef = doc(db, 'watchlists', userId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data().stocks : [];
};
