package httpapi

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"github.com/GabrielMSaraiva/full-stack-calculator/backend/internal/calculator"
)

const maxRequestSize = 1 << 20

type calculateRequest struct {
	Operation calculator.Operation `json:"operation"`
	A         *float64             `json:"a"`
	B         *float64             `json:"b,omitempty"`
}

type calculateResponse struct {
	Result float64 `json:"result"`
}

type errorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type errorResponse struct {
	Error errorBody `json:"error"`
}

func NewHandler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", handleHealth)
	mux.HandleFunc("/api/calculate", handleCalculate)
	return mux
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func handleCalculate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxRequestSize)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	var request calculateRequest
	if err := decoder.Decode(&request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "request body must be valid JSON")
		return
	}

	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		writeError(w, http.StatusBadRequest, "invalid_request", "request body must contain a single JSON object")
		return
	}

	if request.A == nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "field a is required")
		return
	}

	result, err := calculator.Calculate(calculator.Input{
		Operation: request.Operation,
		A:         *request.A,
		B:         request.B,
	})
	if err != nil {
		status, code := calculationError(err)
		writeError(w, status, code, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, calculateResponse{Result: result})
}

func calculationError(err error) (int, string) {
	switch {
	case errors.Is(err, calculator.ErrInvalidOperation):
		return http.StatusBadRequest, "invalid_operation"
	case errors.Is(err, calculator.ErrMissingOperand):
		return http.StatusBadRequest, "missing_operand"
	case errors.Is(err, calculator.ErrInvalidNumber):
		return http.StatusBadRequest, "invalid_number"
	case errors.Is(err, calculator.ErrDivisionByZero):
		return http.StatusUnprocessableEntity, "division_by_zero"
	case errors.Is(err, calculator.ErrNegativeSquareRoot):
		return http.StatusUnprocessableEntity, "negative_square_root"
	default:
		return http.StatusUnprocessableEntity, "invalid_result"
	}
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, errorResponse{Error: errorBody{Code: code, Message: message}})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
