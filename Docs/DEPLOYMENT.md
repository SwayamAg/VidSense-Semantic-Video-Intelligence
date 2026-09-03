# 🚀 Production Deployment Guide for VidSense

This document provides step-by-step instructions for deploying **VidSense** across the **three supported deployment models**:

1. [Option 1: Vercel (Frontend) + Render / Railway (Backend) — *Recommended*](#option-1-vercel--render--railway-recommended)
2. [Option 2: Single VM Server (Docker Compose + Nginx)](#option-2-single-vm-server-docker-compose--nginx)
3. [Option 3: Hugging Face Spaces (Backend Docker Space)](#option-3-hugging-face-spaces-backend-api)

---

## Option 1: Vercel + Render / Railway (Recommended)

This gives you **automatic CI/CD**, zero server maintenance, global Edge caching for the UI, and a free tier.

### Step 1: Deploy Backend (Render)
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Blueprint**.
2. Connect your GitHub repository: `SwayamAg/VidSense`.
3. Render will automatically detect [`render.yaml`](./render.yaml).
4. In the **Environment Variables** prompt, add:
   - `OPENAI_API_KEY`: Your OpenAI API key (`sk-...`).
   - `YOUTUBE_API_KEY` *(Optional)*: Your Google Cloud YouTube Data API v3 key.
5. Click **Apply**.
6. **Live Backend Swagger URL**: [https://yt-rag-bot-semantic-video-intelligence.onrender.com/docs](https://yt-rag-bot-semantic-video-intelligence.onrender.com/docs)

*(Alternative: You can also deploy via [Railway](https://railway.app/) using the included [`railway.toml`](./railway.toml)).*

### Step 2: Deploy Frontend (Vercel)
1. Go to [Vercel](https://vercel.com/new) and import your repository.
2. Under **Root Directory**, click edit and select **`frontend`**.
3. Under **Environment Variables**, add:
   ```env
   NEXT_PUBLIC_API_URL = https://yt-rag-bot-semantic-video-intelligence.onrender.com
   ```
4. Click **Deploy**.
5. **Live Frontend Demo**: [https://vidsense-semantic-video-intelligence.vercel.app/](https://vidsense-semantic-video-intelligence.vercel.app/)


---

## Option 2: Single VM Server (Docker Compose + Nginx)

Best for running on a single cloud VPS (Hetzner, AWS EC2, DigitalOcean, Linode) for ~$4-6/month with complete data privacy and local storage.

### Prerequisites:
- A Linux VPS (Ubuntu 22.04 / 24.04 recommended) with Docker & Docker Compose installed.

### Steps:

1. **Clone the Repository on the Server**:
   ```bash
   git clone https://github.com/SwayamAg/VidSense.git
   cd VidSense
   ```

2. **Set up Environment Variables**:
   ```bash
   cp .env.example .env
   nano .env
   ```
   Add your OpenAI credentials:
   ```env
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-4o-mini
   OPENAI_EMBEDDING_MODEL=text-embedding-3-small
   ```

3. **Launch Production Stack**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

4. **Verify Containers**:
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```
   - Nginx handles incoming HTTP on port `80`.
   - Next.js UI is served at `http://<your-server-ip>/`.
   - FastAPI is reverse-proxied at `http://<your-server-ip>/api/` and `http://<your-server-ip>/docs`.

---

## Option 3: Hugging Face Spaces (Backend API)

Hugging Face Spaces provides **free CPU hardware (2 vCPU, 16GB RAM)** and natively supports Docker.

### Steps:

1. Go to [Hugging Face Spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Space Configuration:
   - **Space Name**: `yt-rag-backend`
   - **License**: `mit`
   - **Space SDK**: **Docker** (Blank)
   - **Hardware**: Free CPU basic
3. Connect via Git or Push directly:
   ```bash
   git remote add space https://huggingface.co/spaces/<YOUR_USERNAME>/yt-rag-backend
   git push space main
   ```
4. In your Space **Settings** → **Variables and secrets**:
   - Add Secret: `OPENAI_API_KEY` = `sk-...`
   - Add Variable: `PORT` = `7860`
5. The Space will build using our root [`Dockerfile`](./Dockerfile) and expose your FastAPI Swagger documentation directly on Hugging Face!

---

## Summary of Deployment Config Files

| File | Target Platform | Purpose |
| :--- | :--- | :--- |
| [`render.yaml`](./render.yaml) | Render | Infrastructure-as-code with persistent FAISS disk |
| [`railway.toml`](./railway.toml) | Railway | Automated container deployment configuration |
| [`frontend/vercel.json`](./frontend/vercel.json) | Vercel | Next.js App Router optimization & build config |
| [`frontend/Dockerfile`](./frontend/Dockerfile) | Production VM / Docker | Standalone multi-stage Next.js container |
| [`docker-compose.prod.yml`](./docker-compose.prod.yml) | Cloud VPS / Server | All-in-one stack (Next.js + FastAPI + Nginx + Volume) |
| [`nginx/nginx.conf`](./nginx/nginx.conf) | Nginx | Reverse proxy routing `/api/` to backend and `/*` to UI |
| [`Dockerfile`](./Dockerfile) | Universal Backend | Dynamic `${PORT:-8000}` compatible with Render, Railway & HF |
