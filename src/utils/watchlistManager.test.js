import {
  getLocalWatchlist,
  getWatchlist,
  getWatchlistSymbols,
  toggleWatchlist,
  removeStockFromWatchlist,
} from "./watchlistManager";

describe("watchlistManager - localStorage error handling", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe("getLocalWatchlist", () => {
    test("returns empty array when localStorage is empty", () => {
      expect(getLocalWatchlist()).toEqual([]);
    });

    test("returns parsed array when localStorage contains valid watchlist JSON", () => {
      const mockStocks = [{ symbol: "AAPL", name: "Apple Inc." }];
      localStorage.setItem("watchlist", JSON.stringify(mockStocks));

      expect(getLocalWatchlist()).toEqual(mockStocks);
    });

    test("handles malformed JSON safely and cleans up corrupted localStorage", () => {
      localStorage.setItem("watchlist", "{invalid-json");

      expect(getLocalWatchlist()).toEqual([]);
      expect(localStorage.getItem("watchlist")).toBeNull();
    });

    test("handles unexpected valid JSON non-array types (object, number, string, boolean)", () => {
      localStorage.setItem("watchlist", JSON.stringify({ symbol: "AAPL" }));
      expect(getLocalWatchlist()).toEqual([]);
      expect(localStorage.getItem("watchlist")).toBeNull();

      localStorage.setItem("watchlist", JSON.stringify(12345));
      expect(getLocalWatchlist()).toEqual([]);

      localStorage.setItem("watchlist", JSON.stringify("plain string"));
      expect(getLocalWatchlist()).toEqual([]);

      localStorage.setItem("watchlist", JSON.stringify(true));
      expect(getLocalWatchlist()).toEqual([]);
    });
  });

  describe("getWatchlist", () => {
    test("returns stored stocks when valid", async () => {
      const mockStocks = [{ symbol: "GOOGL", name: "Alphabet Inc." }];
      localStorage.setItem("watchlist", JSON.stringify(mockStocks));

      const result = await getWatchlist();
      expect(result).toEqual(mockStocks);
    });

    test("falls back to empty array without crashing when localStorage is corrupted", async () => {
      localStorage.setItem("watchlist", "{corrupt:json");

      const result = await getWatchlist();
      expect(result).toEqual([]);
      expect(localStorage.getItem("watchlist")).toBeNull();
    });
  });

  describe("getWatchlistSymbols", () => {
    test("returns symbols array when valid", async () => {
      const mockStocks = [
        { symbol: "AAPL", name: "Apple Inc." },
        { symbol: "MSFT", name: "Microsoft Corp." },
      ];
      localStorage.setItem("watchlist", JSON.stringify(mockStocks));

      const symbols = await getWatchlistSymbols();
      expect(symbols).toEqual(["AAPL", "MSFT"]);
    });

    test("returns empty array without crashing when localStorage is corrupted", async () => {
      localStorage.setItem("watchlist", "corrupted");

      const symbols = await getWatchlistSymbols();
      expect(symbols).toEqual([]);
    });
  });

  describe("toggleWatchlist", () => {
    test("recovers from corrupted localStorage by adding the stock", async () => {
      localStorage.setItem("watchlist", "{broken-json");

      const stock = { symbol: "TSLA", name: "Tesla Inc." };
      await toggleWatchlist(stock);

      const updated = JSON.parse(localStorage.getItem("watchlist"));
      expect(updated).toEqual([stock]);
    });

    test("adds stock if not present in watchlist", async () => {
      const stock1 = { symbol: "AAPL", name: "Apple Inc." };
      const stock2 = { symbol: "TSLA", name: "Tesla Inc." };
      localStorage.setItem("watchlist", JSON.stringify([stock1]));

      await toggleWatchlist(stock2);

      const updated = JSON.parse(localStorage.getItem("watchlist"));
      expect(updated).toEqual([stock1, stock2]);
    });

    test("removes stock if already present in watchlist", async () => {
      const stock = { symbol: "AAPL", name: "Apple Inc." };
      localStorage.setItem("watchlist", JSON.stringify([stock]));

      await toggleWatchlist(stock);

      const updated = JSON.parse(localStorage.getItem("watchlist"));
      expect(updated).toEqual([]);
    });
  });

  describe("removeStockFromWatchlist", () => {
    test("does not crash and safely clears when localStorage is corrupted", async () => {
      localStorage.setItem("watchlist", "{corrupted");

      await expect(removeStockFromWatchlist("AAPL")).resolves.not.toThrow();
      expect(JSON.parse(localStorage.getItem("watchlist"))).toEqual([]);
    });

    test("removes stock with matching symbol", async () => {
      const mockStocks = [
        { symbol: "AAPL", name: "Apple Inc." },
        { symbol: "MSFT", name: "Microsoft Corp." },
      ];
      localStorage.setItem("watchlist", JSON.stringify(mockStocks));

      await removeStockFromWatchlist("AAPL");

      const updated = JSON.parse(localStorage.getItem("watchlist"));
      expect(updated).toEqual([{ symbol: "MSFT", name: "Microsoft Corp." }]);
    });
  });
});
