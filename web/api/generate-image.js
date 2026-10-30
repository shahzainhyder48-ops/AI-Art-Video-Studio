// Vercel serverless endpoint using the OpenAI Images API.
// Set OPENAI_API_KEY in Vercel Project Settings > Environment Variables.
// Never expose API keys in frontend JavaScript or commit them to the repository.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "OpenAI image generation is not configured. Add OPENAI_API_KEY in Vercel Environment Variables."
    });
  }

  try {
    const { prompt, style = "Cinematic watercolor", size = "1536x1024" } = req.body || {};
    if (typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "A prompt is required." });
    }
    if (prompt.length > 1500) {
      return res.status(400).json({ error: "Prompt must be 1,500 characters or fewer." });
    }
    const allowedSizes = new Set(["1024x1024", "1536x1024", "1024x1536", "auto"]);
    const imageSize = allowedSizes.has(size) ? size : "1536x1024";
    const imagePrompt = `${prompt.trim()}, ${String(style).slice(0, 100)} style, cinematic composition, no text unless requested`;

    const upstream = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
        prompt: imagePrompt,
        size: imageSize,
        n: 1
      }),
      signal: AbortSignal.timeout(120000)
    });

    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const providerMessage = result?.error?.message;
      console.error("OpenAI image generation failed:", upstream.status, providerMessage || "No provider message");
      let message = providerMessage || `OpenAI image API returned HTTP ${upstream.status}.`;
      if (upstream.status === 401) message = "OpenAI rejected the API key. Check OPENAI_API_KEY in Vercel.";
      if (upstream.status === 429) message = "OpenAI API quota/rate limit reached. Check API billing and limits.";
      return res.status(502).json({ error: message });
    }

    const encoded = result?.data?.[0]?.b64_json;
    if (!encoded) {
      return res.status(502).json({ error: "OpenAI returned no image data. Please try again." });
    }

    const bytes = Buffer.from(encoded, "base64");
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Length", String(bytes.length));
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.status(200).send(bytes);
  } catch (error) {
    console.error("OpenAI image API error:", error?.message || error);
    return res.status(502).json({
      error: error?.name === "TimeoutError"
        ? "Image generation timed out. Please try again."
        : "Could not generate the image. Check API configuration and try again."
    });
  }
}
