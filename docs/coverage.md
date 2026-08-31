# Coverage report

Recorded on 2026-08-30 after running the commands in the main README.

| Layer | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| Go domain and HTTP packages | 92.0% | — | — | — |
| React application and API client | 74.69% | 73.68% | 78.04% | 82.01% |

Backend package detail:

- `internal/calculator`: 100.0% statement coverage
- `internal/httpapi`: 87.0% statement coverage

The Go total covers the domain and HTTP packages. The thin `cmd/api` process entry point is excluded from that total. The frontend report excludes `main.tsx`, test setup, and generated files so it measures application behavior rather than bootstrap code.

Generated HTML details are available locally after running:

```sh
cd frontend
npm run test:coverage
```

Open `frontend/coverage/index.html` in a browser.
