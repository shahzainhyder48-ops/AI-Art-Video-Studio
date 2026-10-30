"""Local, no-API-key image generation server for AI Art Video Studio.

Run from the repository root with: python -m uvicorn local-ai.server:app --host 127.0.0.1 --port 8000
The first run downloads the open model weights. Image generation runs on this computer.
"""
from pathlib import Path
from io import BytesIO
import threading

import torch
from diffusers import StableDiffusionPipeline
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent.parent
WEB_DIR = ROOT / "web"
MODEL_ID = "segmind/tiny-sd"

app = FastAPI(title="AI Art Video Studio - Local AI")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8000", "http://localhost:8000"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

class ImageRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=700)
    style: str = Field(default="Cinematic watercolor", max_length=80)
    width: int = Field(default=512, ge=256, le=512)
    height: int = Field(default=512, ge=256, le=512)

pipe = None
model_lock = threading.Lock()

def get_pipeline():
    global pipe
    if pipe is None:
        with model_lock:
            if pipe is None:
                device = "cuda" if torch.cuda.is_available() else "cpu"
                dtype = torch.float16 if device == "cuda" else torch.float32
                pipe = StableDiffusionPipeline.from_pretrained(
                    MODEL_ID,
                    torch_dtype=dtype,
                    use_safetensors=True,
                )
                pipe = pipe.to(device)
                pipe.enable_attention_slicing()
    return pipe

@app.get("/api/health")
def health():
    return {
        "ok": True,
        "mode": "local-model-no-api-key",
        "model": MODEL_ID,
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "model_loaded": pipe is not None,
    }

@app.post("/api/generate-image")
def generate_image(body: ImageRequest):
    prompt = f"{body.prompt.strip()}, {body.style}, cinematic composition, high detail"
    try:
        model = get_pipeline()
        with model_lock:
            image = model(
                prompt=prompt,
                width=body.width,
                height=body.height,
                num_inference_steps=20,
                guidance_scale=7.0,
            ).images[0]
        output = BytesIO()
        image.save(output, format="PNG")
        return Response(
            content=output.getvalue(),
            media_type="image/png",
            headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"},
        )
    except Exception as exc:
        # Keep implementation details out of the public error response.
        print(f"Local image generation failed: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Local image generation failed. Check the terminal for details and ensure the model downloaded successfully.",
        ) from exc

@app.get("/")
def index():
    index_file = WEB_DIR / "index.html"
    if not index_file.exists():
        raise HTTPException(status_code=404, detail="web/index.html was not found")
    return FileResponse(index_file)

# Serve the existing frontend at the same origin, so /api/generate-image works unchanged.
app.mount("/", StaticFiles(directory=str(WEB_DIR), html=True), name="web")
