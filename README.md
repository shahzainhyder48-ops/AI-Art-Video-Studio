# AI Art Video Studio

A free, open-source **starter prototype** for creating illustrated MP4 story videos from your own script or a simple topic-based story template.

## Features currently implemented
- Your own script, one scene per line
- Basic topic-to-story template (not an LLM)
- Illustrated scene cards
- MP4 export using FFmpeg
- Optional local voice using pyttsx3 (availability varies by operating system)
- Loop-friendly playback option (not seamless)

**Not yet implemented:** AI image generation, AI motion/video generation, automatic scene animation, truly seamless loops, cloud hosting or unlimited free rendering.

## Requirements
- Python 3.10+
- FFmpeg installed and on PATH
- Python dependencies: `pip install -r requirements.txt`

## Usage
Without voice:

```bash
python app/main.py --duration 30 --topic "a lonely lantern" --voice no --loop yes
```

With your script and optional local voice:

```bash
python app/main.py --script example_script.txt --duration 80 --voice yes --loop no
```

Output is written to `output/video.mp4`. The starter supports durations from 5 to 600 seconds. Long videos require adequate storage and rendering time. The code has not yet been verified on your computer.

## Roadmap
1. Add an interactive form to choose duration, voice, script, style and loop.
2. Integrate optional local/open-weight image models.
3. Integrate open-weight video models with GPU requirements documented.
4. Add better multilingual speech and soundtrack handling.
5. Add tests and smoother loop transitions.

See `skill/SKILL.md` for agent instructions.
