# AI Art Video Studio (Vercel web app)

## AI image generation setup

The app's image-generation endpoint uses the OpenAI Images API. Deploy the `web/` directory to Vercel, then open **Project Settings → Environment Variables** and add:

- `OPENAI_API_KEY` — your secret OpenAI API key (required)
- `OPENAI_IMAGE_MODEL` — optional; defaults to `gpt-image-2`

After adding or changing environment variables, redeploy the project. Never put the API key in browser JavaScript, HTML, or GitHub. OpenAI API usage may incur charges and requires API access/billing; a ChatGPT subscription is not the same as API billing.

## Image preview

After creating a scene plan, choose **Generate Scene Images**. Each successfully generated image appears in the preview gallery in the app. The current client requests up to eight scene images per run. The endpoint returns PNG bytes from OpenAI and displays each image using a browser preview URL.

## Video export limitation

**Export Slideshow Video** creates a video from the generated still images with gentle pan/zoom. It is not true AI-generated motion animation, and this export path does not yet include a narrated voice track. MP4 support depends on the browser's MediaRecorder codecs; where MP4 is unavailable, WebM may be used.

## Local development

The image endpoint is a Vercel serverless function, so opening `index.html` directly from disk will not make `/api/generate-image` work. Run the project with Vercel's local development tooling or deploy it to Vercel, and set the environment variables locally in a private `.env.local` file. Do not commit secrets.

## Testing

The GitHub Actions workflow checks JavaScript syntax. That is not a live API test: actual image generation also requires a valid API key, working API access, and available quota.
