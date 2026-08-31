export type Operation =
  | "add"
  | "subtract"
  | "multiply"
  | "divide"
  | "power"
  | "square_root"
  | "percentage"
  | "reciprocal";

export type Calculation = {
  operation: Operation;
  a: number;
  b?: number;
};

type ErrorResponse = {
  error?: {
    message?: string;
  };
};

export class CalculatorApiError extends Error {}

export async function calculate(input: Calculation): Promise<number> {
  const response = await fetch("/api/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const body = (await response.json()) as ErrorResponse & { result?: number };

  if (!response.ok) {
    throw new CalculatorApiError(body.error?.message ?? "Calculation failed");
  }

  if (typeof body.result !== "number" || !Number.isFinite(body.result)) {
    throw new CalculatorApiError("The server returned an invalid result");
  }

  return body.result;
}

