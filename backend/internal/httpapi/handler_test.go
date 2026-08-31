package httpapi

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCalculateEndpoint(t *testing.T) {
	request := httptest.NewRequest(http.MethodPost, "/api/calculate", strings.NewReader(`{
		"operation": "multiply",
		"a": 6,
		"b": 7
	}`))
	response := httptest.NewRecorder()

	NewHandler().ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
	}

	var body calculateResponse
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if body.Result != 42 {
		t.Fatalf("result = %v, want 42", body.Result)
	}
	if contentType := response.Header().Get("Content-Type"); contentType != "application/json" {
		t.Fatalf("Content-Type = %q, want application/json", contentType)
	}
}

func TestCalculateEndpointErrors(t *testing.T) {
	tests := []struct {
		name      string
		body      string
		status    int
		errorCode string
	}{
		{name: "malformed JSON", body: `{`, status: http.StatusBadRequest, errorCode: "invalid_request"},
		{name: "missing first operand", body: `{"operation":"add","b":2}`, status: http.StatusBadRequest, errorCode: "invalid_request"},
		{name: "missing second operand", body: `{"operation":"add","a":2}`, status: http.StatusBadRequest, errorCode: "missing_operand"},
		{name: "unknown field", body: `{"operation":"add","a":2,"b":3,"round":true}`, status: http.StatusBadRequest, errorCode: "invalid_request"},
		{name: "unsupported operation", body: `{"operation":"log","a":2}`, status: http.StatusBadRequest, errorCode: "invalid_operation"},
		{name: "division by zero", body: `{"operation":"divide","a":2,"b":0}`, status: http.StatusUnprocessableEntity, errorCode: "division_by_zero"},
		{name: "negative square root", body: `{"operation":"square_root","a":-4}`, status: http.StatusUnprocessableEntity, errorCode: "negative_square_root"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodPost, "/api/calculate", strings.NewReader(test.body))
			response := httptest.NewRecorder()

			NewHandler().ServeHTTP(response, request)

			if response.Code != test.status {
				t.Fatalf("status = %d, want %d", response.Code, test.status)
			}

			var body errorResponse
			if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
				t.Fatalf("decode response: %v", err)
			}
			if body.Error.Code != test.errorCode {
				t.Fatalf("error code = %q, want %q", body.Error.Code, test.errorCode)
			}
		})
	}
}

func TestHealthEndpoint(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	response := httptest.NewRecorder()

	NewHandler().ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
	}
}

func TestCalculateEndpointRejectsOtherMethods(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/api/calculate", nil)
	response := httptest.NewRecorder()

	NewHandler().ServeHTTP(response, request)

	if response.Code != http.StatusMethodNotAllowed {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusMethodNotAllowed)
	}
}
