package calculator

import (
	"errors"
	"math"
)

type Operation string

const (
	Add        Operation = "add"
	Subtract   Operation = "subtract"
	Multiply   Operation = "multiply"
	Divide     Operation = "divide"
	Power      Operation = "power"
	SquareRoot Operation = "square_root"
	Percentage Operation = "percentage"
	Reciprocal Operation = "reciprocal"
)

var (
	ErrDivisionByZero     = errors.New("cannot divide by zero")
	ErrInvalidNumber      = errors.New("operands must be finite numbers")
	ErrInvalidOperation   = errors.New("unsupported operation")
	ErrMissingOperand     = errors.New("second operand is required")
	ErrNegativeSquareRoot = errors.New("cannot calculate the square root of a negative number")
	ErrResultOutOfRange   = errors.New("result is outside the supported range")
)

type Input struct {
	Operation Operation
	A         float64
	B         *float64
}

func Calculate(input Input) (float64, error) {
	if !isFinite(input.A) || (input.B != nil && !isFinite(*input.B)) {
		return 0, ErrInvalidNumber
	}

	var result float64

	switch input.Operation {
	case Add, Subtract, Multiply, Divide, Power:
		if input.B == nil {
			return 0, ErrMissingOperand
		}

		b := *input.B
		switch input.Operation {
		case Add:
			result = input.A + b
		case Subtract:
			result = input.A - b
		case Multiply:
			result = input.A * b
		case Divide:
			if b == 0 {
				return 0, ErrDivisionByZero
			}
			result = input.A / b
		case Power:
			result = math.Pow(input.A, b)
		}
	case SquareRoot:
		if input.A < 0 {
			return 0, ErrNegativeSquareRoot
		}
		result = math.Sqrt(input.A)
	case Percentage:
		result = input.A / 100
	case Reciprocal:
		if input.A == 0 {
			return 0, ErrDivisionByZero
		}
		result = 1 / input.A
	default:
		return 0, ErrInvalidOperation
	}

	if !isFinite(result) {
		return 0, ErrResultOutOfRange
	}

	return result, nil
}

func isFinite(value float64) bool {
	return !math.IsNaN(value) && !math.IsInf(value, 0)
}
