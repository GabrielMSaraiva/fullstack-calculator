# Full-stack calculator

A small calculator with a React and TypeScript frontend and a Go HTTP API. The interface takes its layout and dark theme from the Windows Standard Calculator while keeping the implementation focused on the assignment scope.

## Features

- Addition, subtraction, multiplication, and division
- Square, square root, percentage, and reciprocal operations
- Keyboard input for numbers, decimal points, binary operators, Enter, Backspace, and Escape
- Validation and readable error messages for invalid requests, division by zero, negative square roots, and numeric overflow
- Responsive layout that fills smaller screens
- Unit and integration-style tests for both layers
- Optional Docker Compose setup

## Project structure

```text
.
├── backend
│   ├── cmd/api                 # API entry point
│   └── internal
│       ├── calculator          # Arithmetic and domain errors
│       └── httpapi             # JSON request/response handling
├── frontend
│   └── src
│       ├── App.tsx             # Calculator state and interface
│       └── api.ts              # HTTP client
└── compose.yaml
```

The browser owns input and operation sequencing. Every calculation is sent to the Go service, which remains the source of truth for arithmetic rules and validation.

## Requirements

- Go 1.23 or newer
- Node.js 22 or newer with npm
- Docker Desktop only if using the container setup

## Run locally

Start the API from the repository root:

```sh
cd backend
go run ./cmd/api
```

The API listens on `http://localhost:8080` by default. Set the `PORT` environment variable to use another port.

In a second terminal, start the frontend:

```sh
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to the Go service during development.

## Run with Docker

From the repository root:

```sh
docker compose up --build
```

Open `http://localhost:3000`. The API is also available directly on port `8080`.

## API

### Health check

```http
GET /api/health
```

```json
{"status":"ok"}
```

### Calculate

```http
POST /api/calculate
Content-Type: application/json
```

Binary operation example:

```sh
curl -X POST http://localhost:8080/api/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"multiply","a":6,"b":7}'
```

```json
{"result":42}
```

Unary operation example:

```sh
curl -X POST http://localhost:8080/api/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"square_root","a":81}'
```

```json
{"result":9}
```

Supported operation values:

| Operation | Required fields | Behavior |
| --- | --- | --- |
| `add` | `a`, `b` | `a + b` |
| `subtract` | `a`, `b` | `a - b` |
| `multiply` | `a`, `b` | `a × b` |
| `divide` | `a`, `b` | `a ÷ b` |
| `power` | `a`, `b` | `a` raised to `b` |
| `square_root` | `a` | Square root of `a` |
| `percentage` | `a` | `a ÷ 100` |
| `reciprocal` | `a` | `1 ÷ a` |

Errors use a consistent JSON shape. Calculation errors return `422 Unprocessable Entity`; malformed requests and unsupported operations return `400 Bad Request`.

```json
{
  "error": {
    "code": "division_by_zero",
    "message": "cannot divide by zero"
  }
}
```

## Tests and coverage

Backend:

```sh
cd backend
go test ./... -coverprofile=coverage.out
go tool cover -func=coverage.out
```

Frontend:

```sh
cd frontend
npm ci
npm run test:coverage
npm run build
```

The latest recorded results and measurement scope are in [docs/coverage.md](docs/coverage.md). CI repeats the backend tests, frontend tests, and production frontend build on every push and pull request.

## Design decisions and assumptions

- React owns input flow and display state; Go owns arithmetic and validation. This keeps UI behavior separate from calculation rules.
- One `POST /api/calculate` route covers every operation. The API is small enough that Go's standard library is sufficient.
- Calculations use `float64`, percentage means `a / 100`, and invalid operations return structured JSON errors.

## Prompts used

### 1. Architecture review

```text
I plan this architecture:

- React and TypeScript own input state and operation sequencing.
- Go API remains arithmetic source of truth.
- One POST /api/calculate endpoint handles every operation.
- Go domain package contains arithmetic and domain errors.
- HTTP package handles JSON and status codes.
- No Go web framework.
- No frontend state library.

Critique this design for this calculator’s scope.

Identify:
- unnecessary complexity
- coupling risks
- testability problems
- likely future pain
- decisions worth documenting

Do not propose a larger architecture unless current design has a concrete problem. Do not write code.
```

### 2. API contract review

```text
I’m about to implement this API:

POST /api/calculate

Binary request:
{"operation":"multiply","a":6,"b":7}

Unary request:
{"operation":"square_root","a":81}

Success:
{"result":42}

Error:
{"error":{"code":"division_by_zero","message":"cannot divide by zero"}}

Planned operations:
add, subtract, multiply, divide, power, square_root, percentage, reciprocal.

Review contract for ambiguity and missing cases.

Focus on:
- required versus optional operands
- unknown operations
- malformed JSON
- unknown fields
- non-finite values
- division by zero
- numeric overflow
- HTTP status choices
- stable error codes

Return contract corrections and edge-case checklist only. Do not implement handler.
```

### 3. Calculation unit tests

```text
I wrote backend/internal/calculator/calculator.go.

Inspect the implementation and write focused table-driven tests for Calculate.

Cover:
- test name
- operation
- a
- b
- expected result or domain error
- reason test matters

Prioritize boundary behavior and regressions. Avoid redundant cases added only for coverage.

Implement the tests in backend/internal/calculator/calculator_test.go. Run the Go test suite and report the result. Do not modify production code.
```

### 4. Backend pull-request review

```text
Review these files as if reviewing my pull request:

- backend/internal/calculator/calculator.go
- backend/internal/httpapi/handler.go
- backend/cmd/api/main.go
- related tests

Look for:
- arithmetic correctness
- incorrect error mapping
- unsafe or incomplete JSON decoding
- multiple JSON objects
- unknown fields
- oversized request handling
- missing Content-Type behavior
- incorrect HTTP methods or statuses
- numeric edge cases
- unnecessary abstractions

Return findings only, ordered P0 to P2.

For every finding include:
- file and function
- concrete failure scenario
- why existing tests miss it
- smallest conceptual correction

Do not edit files. Do not rewrite implementation.
```

### 5. Frontend state model

```text
I’m implementing calculator state in frontend/src/App.tsx.

Planned state:
- display
- storedValue
- pendingOperation
- expression
- replaceDisplay
- error
- busy

Produce state-transition table for:

- entering digits
- entering decimal
- selecting operator
- replacing operator
- pressing equals
- chaining operations
- applying unary operation
- CE
- C
- backspace
- sign toggle
- API success
- API failure
- entering new value after result
- entering new value after error

Identify contradictory or underspecified transitions.

Do not write React code. I want to validate state model first.
```

### 6. Calculator interaction review

```text
I implemented frontend/src/App.tsx myself.

Review calculator logic without modifying code.

Focus on:
- stale React state
- asynchronous request races
- double submissions
- busy-state behavior
- operator replacement
- chained calculations
- unary operation during pending binary calculation
- starting fresh after result
- error recovery
- decimal and sign behavior
- digit limits
- keyboard listener lifecycle
- formatting very large and small values

Return reproducible interaction sequences for each finding.

Format example:
1. Click 8
2. Click Divide
3. Click 0
4. Click Equals
5. Observe ...

No implementation suggestions unless needed to explain finding.
```

### 7. API client contract review

```text
Review frontend/src/api.ts as the boundary between the UI and the documented JSON API.

Check:
- request path, method, headers, and body
- non-2xx JSON error
- 200 with string result
- 200 with missing result
- 200 with NaN or Infinity
- fallback message when an API error has no message

Return:
- current behavior
- missing test case
- any mismatch with the documented contract

Do not expand the scope to retries, offline support, or timeout handling. Do not write implementation or tests.
```

### 8. Test gap implementation

```text
Review the current tests:

- frontend/src/App.test.tsx
- frontend/src/api.test.ts
- backend/internal/calculator/calculator_test.go
- backend/internal/httpapi/handler_test.go

Find the highest-risk untested behaviors and implement focused tests for them.

Do not optimize for coverage percentage. Prioritize failures users could notice or failures capable of breaking API contract.

Keep each new test tied to a clear regression or API contract requirement.

Run both backend and frontend test suites after making changes. Do not modify production code; report any product defect exposed by a failing test instead.
```

### 9. Accessibility review

```text
Review frontend/src/App.tsx and frontend/src/App.css for accessibility.

Focus only on:
- button accessible names
- keyboard operation
- focus visibility
- error announcements
- tab order
- narrow-screen readability
- long-result overflow
- color contrast

Return findings by severity with manual verification steps.

Do not redesign UI. Do not edit code.
```

### 10. Delivery configuration review

```text
Review delivery configuration by static inspection:

- backend/Dockerfile
- frontend/Dockerfile
- frontend/nginx.conf
- compose.yaml
- .github/workflows/ci.yml

Check:
- Dockerfile build steps
- runtime user permissions
- frontend-to-API networking
- Nginx proxy behavior
- Compose service names, ports, and declared dependencies
- dependency caching
- lockfile use
- missing CI checks
- version compatibility

Return:
1. Confirmed problems
2. Acceptable tradeoffs
3. Commands to run when a Docker daemon is available
4. The success condition for each command

The local Docker daemon is not available. Do not claim that images or containers were successfully run. Do not modify configuration.
```

### 11. Final diff review

```text
Review my current git diff as senior reviewer.

Project scope:
React/TypeScript calculator with Go API, tests, Docker Compose, and CI.

Review only changed lines plus necessary surrounding context.

Prioritize:
- correctness regressions
- broken API assumptions
- missing tests
- accessibility regressions
- accidental complexity
- misleading documentation
- generated or unwanted files

Ignore personal style unless it affects maintainability.

Return:
- blocking findings
- non-blocking findings
- questions
- release verdict

Do not rewrite code. If no actionable finding exists, say so clearly.
```

### 12. Documentation consistency review

```text
Compare implementation against README.md.

Verify:
- setup commands
- ports
- environment variables
- API examples
- operation names
- error statuses
- Docker instructions
- test and coverage commands
- documented limitations
- architectural claims

Return discrepancies with exact replacement wording.

Do not validate historical coverage percentages without fresh command output. Do not edit files. Do not invent features or results that cannot be verified.
```
