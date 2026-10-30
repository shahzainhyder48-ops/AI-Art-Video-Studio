// Vercel serverless endpoint. Uses the public Pollinations image endpoint as an
// optional no-key prototype provider; public availability/rate limits can change.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });
  try {
    const { prompt, style = "Cinematic watercolor" } = req.body || {};
    if (typeof prompt !== "string" || !prompt.trim()) return res.status(400).json({ error: "A prompt is required." });
    if (prompt.length > 700) return res.status(400).json({ error: "Prompt must be 700 characters or fewer." });
    const fullPrompt = `${prompt.trim()}, ${String(style).slice(0, 80)} style, cinematic composition, no text`;
    const url = "https://image.pollinations.ai/prompt/" + encodeURIComponent(fullPrompt) + "?width=768&height=432&nologo=true&safe=true";
    const upstream = await fetch(url, { headers: { "Accept": "image/*" } });
    if (!upstream.ok) return res.status(502).json({ error: "The public image provider is unavailable right now. Try again later." });
    const type = upstream.headers.get("content-type") || "";
    if (!type.startsWith("image/")) return res.status(502).json({ error: "Image provider returned an unexpected response." });
    const bytes = Buffer.from(await upstream.arrayBuffer());
    res.setHeader("Content-Type", type);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.status(200).send(bytes);
  } catch (e) {
    return res.status(502).json({ error: "Image generation failed. Check provider availability and try again." });
  }
}