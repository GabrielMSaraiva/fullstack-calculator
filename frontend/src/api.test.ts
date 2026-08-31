import { afterEach, describe, expect, it, vi } from "vitest";
import { calculate, CalculatorApiError } from "./api";

describe("calculate", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the result from the API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: 12 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(calculate({ operation: "add", a: 5, b: 7 })).resolves.toBe(12);
    expect(fetchMock).toHaveBeenCalledWith("/api/calculate", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ operation: "add", a: 5, b: 7 }),
    }));
  });

  it("uses the API error message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { message: "cannot divide by zero" } }),
    }));

    await expect(calculate({ operation: "divide", a: 4, b: 0 }))
      .rejects.toEqual(new CalculatorApiError("cannot divide by zero"));
  });

  it("rejects a response without a numeric result", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: "12" }),
    }));

    await expect(calculate({ operation: "add", a: 5, b: 7 }))
      .rejects.toThrow("invalid result");
  });
});

