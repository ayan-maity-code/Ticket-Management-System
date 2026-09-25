# Support Ticket Frontend

Vite + React UI for the Support Ticket Management System.

## Development

1. Start the backend on `http://localhost:8080`.
2. Install dependencies and run the dev server (proxies `/api` to the backend):

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Configuration

- **`VITE_API_BASE_URL`**: Optional full backend URL. Leave unset in development to use the Vite proxy (`/api` → `http://localhost:8080`).
- **`VITE_PROXY_TARGET`**: Backend URL for the dev proxy (default `http://localhost:8080`).

## Build

```bash
npm run build
npm run preview
```
