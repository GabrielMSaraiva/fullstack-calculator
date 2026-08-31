import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { calculate } from "./api";

vi.mock("./api", async (importOriginal) => {
  const original = await importOriginal<typeof import("./api")>();
  return { ...original, calculate: vi.fn() };
});

const calculateMock = vi.mocked(calculate);

describe("Calculator", () => {
  beforeEach(() => {
    calculateMock.mockReset();
  });

  it("adds two values through the API", async () => {
    const user = userEvent.setup();
    calculateMock.mockResolvedValue(15);
    render(<App />);

    await user.click(screen.getByRole("button", { name: "7" }));
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "8" }));
    await user.click(screen.getByRole("button", { name: "Equals" }));

    expect(calculateMock).toHaveBeenCalledWith({ operation: "add", a: 7, b: 8 });
    expect(screen.getByLabelText("Display")).toHaveTextContent("15");
  });

  it("does not render inactive calculator controls", () => {
    render(<App />);

    expect(screen.queryByRole("button", { name: "Menu" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "History" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Memory controls")).not.toBeInTheDocument();
    expect(screen.queryByText("Standard")).not.toBeInTheDocument();
  });

  it("runs advanced unary operations", async () => {
    const user = userEvent.setup();
    calculateMock.mockResolvedValue(9);
    render(<App />);

    await user.click(screen.getByRole("button", { name: "8" }));
    await user.click(screen.getByRole("button", { name: "1" }));
    await user.click(screen.getByRole("button", { name: "Square root" }));

    expect(calculateMock).toHaveBeenCalledWith({ operation: "square_root", a: 81 });
    expect(screen.getByLabelText("Display")).toHaveTextContent("9");
  });

  it("shows API errors without losing the current entry", async () => {
    const user = userEvent.setup();
    calculateMock.mockRejectedValue(new Error("cannot divide by zero"));
    render(<App />);

    await user.click(screen.getByRole("button", { name: "8" }));
    await user.click(screen.getByRole("button", { name: "Divide" }));
    await user.click(screen.getByRole("button", { name: "0" }));
    await user.click(screen.getByRole("button", { name: "Equals" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("cannot divide by zero");
    expect(screen.getByLabelText("Display")).toHaveTextContent("0");
  });

  it("supports keyboard input and clear", async () => {
    const user = userEvent.setup();
    calculateMock.mockResolvedValue(42);
    render(<App />);

    await user.keyboard("6*7{Enter}");
    expect(calculateMock).toHaveBeenCalledWith({ operation: "multiply", a: 6, b: 7 });
    expect(screen.getByLabelText("Display")).toHaveTextContent("42");

    await user.keyboard("{Escape}");
    expect(screen.getByLabelText("Display")).toHaveTextContent("0");
  });

  it("supports entry editing controls", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "1" }));
    await user.click(screen.getByRole("button", { name: "2" }));
    await user.click(screen.getByRole("button", { name: "3" }));
    await user.click(screen.getByRole("button", { name: "Backspace" }));
    await user.click(screen.getByRole("button", { name: "Toggle sign" }));
    await user.click(screen.getByRole("button", { name: "Decimal point" }));
    await user.click(screen.getByRole("button", { name: "5" }));

    expect(screen.getByLabelText("Display")).toHaveTextContent("-12.5");

    await user.click(screen.getByRole("button", { name: "CE" }));
    expect(screen.getByLabelText("Display")).toHaveTextContent("0");
  });

  it("chains operations using the previous result", async () => {
    const user = userEvent.setup();
    calculateMock.mockResolvedValueOnce(5).mockResolvedValueOnce(20);
    render(<App />);

    await user.keyboard("2+3*");
    await waitFor(() => expect(screen.getByLabelText("Display")).toHaveTextContent("5"));
    await user.keyboard("4{Enter}");

    expect(calculateMock).toHaveBeenNthCalledWith(1, { operation: "add", a: 2, b: 3 });
    expect(calculateMock).toHaveBeenNthCalledWith(2, { operation: "multiply", a: 5, b: 4 });
    expect(screen.getByLabelText("Display")).toHaveTextContent("20");
  });
});
