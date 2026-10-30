# Local AI image generation (no API key)

This optional backend runs an open image model on your computer. It does not call OpenAI or require an API key. The first run downloads model weights from Hugging Face, so you need internet for setup, several GB of free disk space, and preferably a compatible NVIDIA GPU. CPU-only generation can be very slow.

## Windows setup

From the repository root, install Python 3.10 or 3.11, then run in PowerShell:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r local_ai/requirements.txt
python -m uvicorn local_ai.server:app --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000. Create a scene plan and click **Generate Scene Images**; the existing app calls `/api/generate-image` and should show the returned images in its preview gallery. First generation may take time while weights download.

If PowerShell blocks activation, use Command Prompt and run `.venv\Scripts\activate.bat`. If you have an NVIDIA GPU, install the PyTorch build matching your CUDA setup using the official PyTorch install selector.

## Limitations

- Uses compact `segmind/tiny-sd`; image quality and prompt following are more limited than large hosted models.
- No API key or per-image hosted API charge is needed, but your computer supplies compute, storage and electricity.
- This local model is not suitable for Vercel serverless deployment. The backend must run on a computer or server you control. A static frontend hosted elsewhere will need network access to that backend and suitable CORS/security configuration.
- The existing video export is a slideshow from still images, not genuine AI motion animation, and does not yet add a narrated voice track.
