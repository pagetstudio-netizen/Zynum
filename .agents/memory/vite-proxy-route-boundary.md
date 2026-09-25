---
name: Vite proxy route boundary
description: Avoid frontend routes being mistaken for API calls by a Vite development proxy.
---

Vite proxy entries can match by prefix. A plain `/api` proxy also captures frontend URLs that merely start with `/api`, such as `/api-docs`, and forwards them to the backend instead of serving the SPA.

**Why:** Direct navigation to the documentation route returned a backend 404 even though the frontend route existed and the homepage loaded correctly.

**How to apply:** Match `/api` only at a segment boundary (exact `/api` or `/api/...`) whenever the frontend also defines routes whose names begin with `api`.