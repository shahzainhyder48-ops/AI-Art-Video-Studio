// No-key prototype image endpoint. Calls the public Pollinations image service;
// the image request is initiated by this website's backend, not ChatGPT image generation.
// Anonymous availability/rate limits are controlled by the provider and can change.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST." });
  }

  try {
    const { prompt, style = "Cinematic watercolor", width = 768, height = 432 } = req.body || {};
    if (typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "A prompt is required." });
    }
    if (prompt.length > 700) {
      return res.status(400).json({ error: "Prompt must be 700 characters or fewer." });
    }

    const w = Math.max(256, Math.min(768, Number(width) || 768));
    const h = Math.max(256, Math.min(768, Number(height) || 432));
    const fullPrompt = `${prompt.trim()}, ${String(style).slice(0, 80)} style, cinematic composition, no text`;
    const url = new URL("https://image.pollinations.ai/prompt/" + encodeURIComponent(fullPrompt));
    url.searchParams.set("width", String(w));
    url.searchParams.set("height", String(h));
    url.searchParams.set("nologo", "true");
    url.searchParams.set("safe", "true");

    const upstream = await fetch(url, {
      headers: { Accept: "image/*" },
      signal: AbortSignal.timeout(90000)
    });
    if (!upstream.ok) {
      console.error("Public image service returned HTTP", upstream.status);
      if (upstream.status === 429 || upstream.status === 402) {
        return res.status(429).json({ error: "The free image service is rate-limited or unavailable. Wait a little and retry." });
      }
      return res.status(502).json({ error: `The image service returned HTTP ${upstream.status}. Try again later.` });
    }

    const contentType = upstream.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return res.status(502).json({ error: "The image service returned a non-image response." });
    }
    const bytes = Buffer.from(await upstream.arrayBuffer());
    if (!bytes.length) return res.status(502).json({ error: "The image service returned an empty image." });

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", String(bytes.length));
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.status(200).send(bytes);
  } catch (error) {
    console.error("Image endpoint error:", error?.message || error);
    return res.status(502).json({ error: "Image generation failed or timed out. Try again." });
  }
}
