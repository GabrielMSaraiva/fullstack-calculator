package calculator

import (
	"errors"
	"math"
	"testing"
)

func TestCalculate(t *testing.T) {
	tests := []struct {
		name  string
		input Input
		want  float64
	}{
		{name: "adds", input: Input{Operation: Add, A: 12, B: number(8)}, want: 20},
		{name: "subtracts", input: Input{Operation: Subtract, A: 12, B: number(8)}, want: 4},
		{name: "multiplies", input: Input{Operation: Multiply, A: 2.5, B: number(4)}, want: 10},
		{name: "divides", input: Input{Operation: Divide, A: 9, B: number(4)}, want: 2.25},
		{name: "raises to a power", input: Input{Operation: Power, A: 3, B: number(3)}, want: 27},
		{name: "finds square root", input: Input{Operation: SquareRoot, A: 81}, want: 9},
		{name: "converts to percentage", input: Input{Operation: Percentage, A: 45}, want: 0.45},
		{name: "finds reciprocal", input: Input{Operation: Reciprocal, A: 4}, want: 0.25},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got, err := Calculate(test.input)
			if err != nil {
				t.Fatalf("Calculate() returned an error: %v", err)
			}
			if math.Abs(got-test.want) > 1e-12 {
				t.Fatalf("Calculate() = %v, want %v", got, test.want)
			}
		})
	}
}

func TestCalculateErrors(t *testing.T) {
	tests := []struct {
		name  string
		input Input
		want  error
	}{
		{name: "division by zero", input: Input{Operation: Divide, A: 5, B: number(0)}, want: ErrDivisionByZero},
		{name: "reciprocal of zero", input: Input{Operation: Reciprocal, A: 0}, want: ErrDivisionByZero},
		{name: "negative square root", input: Input{Operation: SquareRoot, A: -1}, want: ErrNegativeSquareRoot},
		{name: "missing second operand", input: Input{Operation: Add, A: 5}, want: ErrMissingOperand},
		{name: "unknown operation", input: Input{Operation: "log", A: 5}, want: ErrInvalidOperation},
		{name: "infinite operand", input: Input{Operation: Percentage, A: math.Inf(1)}, want: ErrInvalidNumber},
		{name: "overflowing result", input: Input{Operation: Power, A: math.MaxFloat64, B: number(2)}, want: ErrResultOutOfRange},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			_, err := Calculate(test.input)
			if !errors.Is(err, test.want) {
				t.Fatalf("Calculate() error = %v, want %v", err, test.want)
			}
		})
	}
}

func number(value float64) *float64 {
	return &value
}
