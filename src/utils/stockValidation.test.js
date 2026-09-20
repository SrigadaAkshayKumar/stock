import { validateStockTicker } from "./stockValidation";

describe("validateStockTicker", () => {
  test("validates exact symbol in uppercase", () => {
    const result = validateStockTicker("RELIANCE.NS");
    expect(result.isValid).toBe(true);
    expect(result.stock).toBeDefined();
    expect(result.stock.symbol).toBe("RELIANCE.NS");
    expect(result.error).toBeNull();
  });

  test("validates exact symbol in lowercase / mixed case", () => {
    const result = validateStockTicker("tcs.bo");
    expect(result.isValid).toBe(true);
    expect(result.stock).toBeDefined();
    expect(result.stock.symbol).toBe("TCS.BO");
    expect(result.error).toBeNull();
  });

  test("validates base ticker without exchange extension", () => {
    const result = validateStockTicker("INFY");
    expect(result.isValid).toBe(true);
    expect(result.stock).toBeDefined();
    expect(result.stock.symbol).toMatch(/INFY/);
    expect(result.error).toBeNull();
  });

  test("validates base ticker in lowercase", () => {
    const result = validateStockTicker("reliance");
    expect(result.isValid).toBe(true);
    expect(result.stock).toBeDefined();
    expect(result.stock.symbol).toMatch(/RELIANCE/);
    expect(result.error).toBeNull();
  });

  test("validates by full company name", () => {
    const result = validateStockTicker("Tata Consultancy Services");
    expect(result.isValid).toBe(true);
    expect(result.stock).toBeDefined();
    expect(result.stock.name).toBe("Tata Consultancy Services");
    expect(result.error).toBeNull();
  });

  test("rejects unsupported ticker symbol with error message", () => {
    const result = validateStockTicker("INVALIDXYZ123");
    expect(result.isValid).toBe(false);
    expect(result.stock).toBeNull();
    expect(result.error).toBe("Ticker not found. Please select a valid stock symbol.");
  });

  test("rejects ticker with unsupported exchange suffix", () => {
    const result = validateStockTicker("TCS.INVALID");
    expect(result.isValid).toBe(false);
    expect(result.stock).toBeNull();
    expect(result.error).toBe("Ticker not found. Please select a valid stock symbol.");
  });

  test("handles empty string query gracefully", () => {
    const result = validateStockTicker("");
    expect(result.isValid).toBe(false);
    expect(result.stock).toBeNull();
    expect(result.error).toBeNull();
  });

  test("handles whitespace-only query gracefully", () => {
    const result = validateStockTicker("   ");
    expect(result.isValid).toBe(false);
    expect(result.stock).toBeNull();
    expect(result.error).toBeNull();
  });

  test("handles null or non-string query gracefully", () => {
    expect(validateStockTicker(null).isValid).toBe(false);
    expect(validateStockTicker(undefined).isValid).toBe(false);
    expect(validateStockTicker(123).isValid).toBe(false);
  });
});
