// Vercel serverless endpoint for AI image generation via Pollinations.
// Configure POLLINATIONS_API_KEY in Vercel Project Settings > Environment Variables.
// Never place the secret key in browser JavaScript or commit it to GitHub.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST." });
  }

  const apiKey = process.env.POLLINATIONS_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "Image generation is not configured. Add POLLINATIONS_API_KEY in Vercel Environment Variables."
    });
  }

  try {
    const { prompt, style = "Cinematic watercolor", width = 768, height = 432 } = req.body || {};
    if (typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "A prompt is required." });
    }
    if (prompt.length > 700) {
      return res.status(400).json({ error: "Prompt must be 700 characters or fewer." });
    }
    const safeWidth = Math.max(256, Math.min(1024, Number(width) || 768));
    const safeHeight = Math.max(256, Math.min(1024, Number(height) || 432));
    const fullPrompt = `${prompt.trim()}, ${String(style).slice(0, 80)} style, cinematic composition, no text`;
    const url = "https://gen.pollinations.ai/image/" + encodeURIComponent(fullPrompt)
      + `?model=flux&width=${safeWidth}&height=${safeHeight}&safe=true`;

    const upstream = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "image/*" },
      signal: AbortSignal.timeout(90000)
    });
    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      console.error("Pollinations image request failed:", upstream.status, detail.slice(0, 300));
      return res.status(502).json({
        error: upstream.status === 401 || upstream.status === 403
          ? "Image provider rejected the API key. Check POLLINATIONS_API_KEY."
          : upstream.status === 402
            ? "Image provider reports insufficient credits."
            : `Image provider failed (HTTP ${upstream.status}). Please try again.`
      });
    }

    const type = upstream.headers.get("content-type") || "";
    if (!type.startsWith("image/")) {
      return res.status(502).json({ error: "Image provider returned an unexpected response." });
    }
    const bytes = Buffer.from(await upstream.arrayBuffer());
    if (!bytes.length) return res.status(502).json({ error: "Image provider returned an empty image." });

    res.setHeader("Content-Type", type);
    res.setHeader("Content-Length", String(bytes.length));
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.status(200).send(bytes);
  } catch (error) {
    console.error("Image generation error:", error?.message || error);
    return res.status(502).json({ error: "Image generation failed or timed out. Please try again." });
  }
}
