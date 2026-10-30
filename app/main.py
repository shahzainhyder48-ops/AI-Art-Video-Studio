import argparse
import shutil
import subprocess
import textwrap
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output"

def font(size):
    for path in ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "C:/Windows/Fonts/arial.ttf"]:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()

def scene_image(text, index, total, path):
    im = Image.new("RGB", (1280, 720), (20, 37, 65))
    d = ImageDraw.Draw(im)
    for i in range(65):
        x, y = (i * 197 + index * 73) % 1280, (i * 83 + index * 31) % 510
        d.ellipse((x, y, x + 3, y + 3), fill=(210, 222, 235))
    d.ellipse((930, 75, 1080, 225), fill=(249, 225, 164))
    for i in range(5):
        x = i * 290 - 100
        d.polygon([(x, 590), (x + 190, 280), (x + 400, 590)], fill=(30 + i * 5, 65 + i * 4, 80 + i * 3))
    d.rectangle((0, 550, 1280, 720), fill=(12, 27, 45))
    for j, line in enumerate(textwrap.wrap(text, 43)[:3]):
        box = d.textbbox((0, 0), line, font=font(38))
        d.text(((1280 - box[2]) // 2, 570 + 47 * j), line, font=font(38), fill="white")
    d.text((35, 30), f"SCENE {index}/{total}", font=font(25), fill="white")
    im.save(path)

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--script", type=Path)
    p.add_argument("--topic", default="a little lantern")
    p.add_argument("--duration", type=int, default=30)
    p.add_argument("--voice", choices=["yes", "no"], default="no")
    p.add_argument("--loop", choices=["yes", "no"], default="no")
    a = p.parse_args()
    if not shutil.which("ffmpeg"):
        p.error("Install FFmpeg and add it to PATH first.")
    if not 5 <= a.duration <= 600:
        p.error("Duration must be 5 to 600 seconds.")
    if a.script:
        scenes = [s.strip() for s in a.script.read_text(encoding="utf-8").splitlines() if s.strip()]
    else:
        scenes = [f"Once upon a time, there was {a.topic}.",
                  "Every day brought a new challenge and a quiet hope.",
                  "One unexpected moment changed everything.",
                  "A small act of kindness made the world brighter."]
    if not scenes:
        p.error("The script has no scenes.")
    OUT.mkdir(exist_ok=True)
    clips = []
    for i, scene in enumerate(scenes, 1):
        png, mp4 = OUT / f"scene_{i:03}.png", OUT / f"scene_{i:03}.mp4"
        scene_image(scene, i, len(scenes), png)
        subprocess.run(["ffmpeg", "-y", "-loop", "1", "-i", str(png), "-t",
                        str(a.duration / len(scenes)), "-r", "24", "-c:v", "libx264",
                        "-pix_fmt", "yuv420p", str(mp4)], check=True, stdout=subprocess.DEVNULL)
        clips.append(mp4)
    playlist = OUT / "playlist.txt"
    playlist.write_text("".join(f"file '{c.name}'\n" for c in clips), encoding="utf-8")
    silent = OUT / "silent.mp4"
    subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(playlist),
                    "-c", "copy", str(silent)], check=True, stdout=subprocess.DEVNULL)
    final = OUT / "video.mp4"
    if a.voice == "yes":
        import pyttsx3
        engine = pyttsx3.init()
        wav = OUT / "voice.wav"
        engine.save_to_file(" ".join(scenes), str(wav))
        engine.runAndWait()
        if not wav.exists() or wav.stat().st_size == 0:
            raise RuntimeError("Voice synthesis failed; try --voice no.")
        subprocess.run(["ffmpeg", "-y", "-i", str(silent), "-i", str(wav),
                        "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac",
                        "-af", "apad", "-t", str(a.duration), str(final)], check=True)
    else:
        shutil.copyfile(silent, final)
    print("Video saved:", final)
    if a.loop == "yes":
        print("Loop requested: repeatable MP4, but transitions are not seamless.")

if __name__ == "__main__":
    main()
