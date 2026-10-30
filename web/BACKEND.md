# Backend status

The Vercel backend includes three serverless endpoints:

- POST /api/story — creates a simple local scene outline, or returns the supplied script.
- GET /api/health — reports whether a remote renderer is configured.
- POST /api/render — securely proxies a render request to RENDER_API_URL. RENDER_API_KEY stays server-side.

## Why rendering is separate
Full open-weight image/video generation needs large model files, GPU memory and long-running jobs. Vercel serverless is suitable for the website and lightweight API orchestration, not for hosting those GPU models or reliably composing long videos. Configure RENDER_API_URL later to a GPU machine/service running your chosen open models and FFmpeg.

There is deliberately no fake unlimited-free claim. Compute, memory, storage and provider limits still apply even when model weights are free/open.
