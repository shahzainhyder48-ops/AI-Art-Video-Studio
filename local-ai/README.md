# Local AI image generation (no API key)

This option runs an open image model on your own computer. It does not call the OpenAI API and does not require an API key. The model weights are downloaded on first launch from Hugging Face; generation then runs locally. You still need an internet connection for the initial download, sufficient disk space, and ideally a compatible NVIDIA GPU. CPU-only generation can be very slow.

## Requirements

- Python 3.10 or 3.11 recommended
- Several GB of free disk space for model weights and Python packages
- Internet for the initial model download
- For faster generation: a compatible NVIDIA GPU and a PyTorch build matching your CUDA setup

## Install and run (Windows PowerShell)

From the repository root:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r local-ai/requirements.txt
python -m uvicorn local-ai.server:app --host 127.0.0.1 --port 8000
```

Then open http://127.0.0.1:8000 in your browser, create a scene plan, and click **Generate Scene Images**. The current frontend should display each image in its preview gallery. The first image request may take a while while the model downloads and initializes.

If PowerShell blocks activation, use Command Prompt and run `.venv\Scripts\activate.bat`. On a machine with an NVIDIA GPU, install the appropriate PyTorch build from the official PyTorch install selector before installing the remaining requirements.

## Limitations

- This uses the compact `segmind/tiny-sd` model; image quality and prompt following are more limited than large hosted image models.
- It is free to run locally after downloading the model, but uses your computer's CPU/GPU, electricity, RAM/VRAM and disk.
- Do not deploy this diffusion model to Vercel serverless functions: model weights and inference exceed typical serverless resource limits. Deploy the frontend separately only if you also provide a machine that runs the model server.
- The browser slideshow exporter still makes a slideshow from still images, not genuine AI video animation.
