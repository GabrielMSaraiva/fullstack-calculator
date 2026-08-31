import { useEffect, useState } from "react";
import { calculate, type Operation } from "./api";
import "./App.css";

type BinaryOperation = "add" | "subtract" | "multiply" | "divide";

const operationSymbols: Record<BinaryOperation, string> = {
  add: "+",
  subtract: "−",
  multiply: "×",
  divide: "÷",
};

function formatNumber(value: number): string {
  if (Object.is(value, -0)) return "0";

  const absolute = Math.abs(value);
  if (absolute >= 1e12 || (absolute > 0 && absolute < 1e-9)) {
    return value.toExponential(8).replace(/\.0+(?=e)/, "");
  }

  return Number(value.toPrecision(12)).toString();
}

export default function App() {
  const [display, setDisplay] = useState("0");
  const [storedValue, setStoredValue] = useState<number | null>(null);
  const [pendingOperation, setPendingOperation] = useState<BinaryOperation | null>(null);
  const [expression, setExpression] = useState("");
  const [replaceDisplay, setReplaceDisplay] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function clearAll() {
    setDisplay("0");
    setStoredValue(null);
    setPendingOperation(null);
    setExpression("");
    setReplaceDisplay(false);
    setError("");
  }

  function startFresh(value: string) {
    setDisplay(value);
    setStoredValue(null);
    setPendingOperation(null);
    setExpression("");
    setReplaceDisplay(false);
    setError("");
  }

  function inputDigit(digit: string) {
    if (busy) return;
    if (error) {
      startFresh(digit);
      return;
    }

    const digits = display.replace(/[-.]/g, "").length;
    if (!replaceDisplay && digits >= 15) return;

    if (replaceDisplay || display === "0") {
      setDisplay(digit);
      setReplaceDisplay(false);
    } else {
      setDisplay((current) => current + digit);
    }
  }

  function inputDecimal() {
    if (busy) return;
    if (error) {
      startFresh("0.");
      return;
    }

    if (replaceDisplay) {
      setDisplay("0.");
      setReplaceDisplay(false);
    } else if (!display.includes(".")) {
      setDisplay((current) => current + ".");
    }
  }

  function clearEntry() {
    if (busy) return;
    setDisplay("0");
    setReplaceDisplay(false);
    setError("");
  }

  function backspace() {
    if (busy) return;
    if (error) {
      clearAll();
      return;
    }
    if (replaceDisplay) return;

    setDisplay((current) => {
      if (current.length <= 1 || (current.startsWith("-") && current.length === 2)) {
        return "0";
      }
      return current.slice(0, -1);
    });
  }

  function toggleSign() {
    if (busy || error || display === "0") return;
    setDisplay((current) => (current.startsWith("-") ? current.slice(1) : `-${current}`));
  }

  async function requestCalculation(operation: Operation, a: number, b?: number) {
    setBusy(true);
    setError("");
    try {
      return await calculate({ operation, a, ...(b === undefined ? {} : { b }) });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Calculation failed");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function chooseOperation(operation: BinaryOperation) {
    if (busy || error) return;

    const currentValue = Number(display);
    let nextStoredValue = currentValue;

    if (pendingOperation && storedValue !== null && !replaceDisplay) {
      const result = await requestCalculation(pendingOperation, storedValue, currentValue);
      if (result === null) return;
      nextStoredValue = result;
      setDisplay(formatNumber(result));
    }

    setStoredValue(nextStoredValue);
    setPendingOperation(operation);
    setExpression(`${formatNumber(nextStoredValue)} ${operationSymbols[operation]}`);
    setReplaceDisplay(true);
  }

  async function equals() {
    if (busy || error || pendingOperation === null || storedValue === null) return;

    const currentValue = Number(display);
    const operation = pendingOperation;
    const firstValue = storedValue;
    setExpression(`${formatNumber(firstValue)} ${operationSymbols[operation]} ${formatNumber(currentValue)} =`);

    const result = await requestCalculation(operation, firstValue, currentValue);
    if (result === null) return;

    setDisplay(formatNumber(result));
    setStoredValue(null);
    setPendingOperation(null);
    setReplaceDisplay(true);
  }

  async function unaryOperation(operation: "square_root" | "percentage" | "reciprocal" | "power") {
    if (busy || error) return;

    const value = Number(display);
    const labels: Record<typeof operation, string> = {
      square_root: `√(${formatNumber(value)})`,
      percentage: `${formatNumber(value)}%`,
      reciprocal: `1/(${formatNumber(value)})`,
      power: `${formatNumber(value)}²`,
    };
    setExpression(labels[operation]);

    const result = await requestCalculation(operation, value, operation === "power" ? 2 : undefined);
    if (result === null) return;

    setDisplay(formatNumber(result));
    setReplaceDisplay(true);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (/^[0-9]$/.test(event.key)) inputDigit(event.key);
      else if (event.key === "." || event.key === ",") inputDecimal();
      else if (event.key === "+") void chooseOperation("add");
      else if (event.key === "-") void chooseOperation("subtract");
      else if (event.key === "*") void chooseOperation("multiply");
      else if (event.key === "/") void chooseOperation("divide");
      else if (event.key === "Enter" || event.key === "=") void equals();
      else if (event.key === "Backspace") backspace();
      else if (event.key === "Escape") clearAll();
      else return;

      event.preventDefault();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <main className="page">
      <section className="calculator" aria-label="Calculator">
        <div className="display-panel">
          <div className="expression" aria-live="polite">{expression || "\u00a0"}</div>
          <output className="display" aria-label="Display">{display}</output>
          <div className="error" role={error ? "alert" : undefined}>{error || "\u00a0"}</div>
        </div>

        <div className="keypad">
          <button type="button" onClick={() => void unaryOperation("percentage")}>%</button>
          <button type="button" onClick={clearEntry}>CE</button>
          <button type="button" onClick={clearAll}>C</button>
          <button type="button" onClick={backspace} aria-label="Backspace">⌫</button>

          <button type="button" onClick={() => void unaryOperation("reciprocal")} aria-label="Reciprocal">⅟ₓ</button>
          <button type="button" onClick={() => void unaryOperation("power")} aria-label="Square">x²</button>
          <button type="button" onClick={() => void unaryOperation("square_root")} aria-label="Square root">²√x</button>
          <button className="operator" type="button" onClick={() => void chooseOperation("divide")} aria-label="Divide">÷</button>

          <button className="number" type="button" onClick={() => inputDigit("7")}>7</button>
          <button className="number" type="button" onClick={() => inputDigit("8")}>8</button>
          <button className="number" type="button" onClick={() => inputDigit("9")}>9</button>
          <button className="operator" type="button" onClick={() => void chooseOperation("multiply")} aria-label="Multiply">×</button>

          <button className="number" type="button" onClick={() => inputDigit("4")}>4</button>
          <button className="number" type="button" onClick={() => inputDigit("5")}>5</button>
          <button className="number" type="button" onClick={() => inputDigit("6")}>6</button>
          <button className="operator" type="button" onClick={() => void chooseOperation("subtract")} aria-label="Subtract">−</button>

          <button className="number" type="button" onClick={() => inputDigit("1")}>1</button>
          <button className="number" type="button" onClick={() => inputDigit("2")}>2</button>
          <button className="number" type="button" onClick={() => inputDigit("3")}>3</button>
          <button className="operator" type="button" onClick={() => void chooseOperation("add")} aria-label="Add">+</button>

          <button type="button" onClick={toggleSign} aria-label="Toggle sign">⁺/₋</button>
          <button className="number" type="button" onClick={() => inputDigit("0")}>0</button>
          <button type="button" onClick={inputDecimal} aria-label="Decimal point">.</button>
          <button className="equals" type="button" onClick={() => void equals()} aria-label="Equals" disabled={busy}>=</button>
        </div>
      </section>
    </main>
  );
}
