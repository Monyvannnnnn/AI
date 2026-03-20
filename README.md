# UI Builder Bot

## Keeping API keys hidden in production

This app is already set up the right way for deployment:

- The React frontend only uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Those `VITE_` values are public by design and will be visible in the browser bundle.
- The private AI key stays on the server in the Supabase Edge Function at `supabase/functions/generate-code/index.ts`.

## What must stay secret

Do not put private provider keys in any `VITE_` variable.

Keep secrets like `LOVABLE_API_KEY` only in Supabase secrets:

```bash
supabase secrets set LOVABLE_API_KEY=your_secret_key
```

Then deploy the function:

```bash
supabase functions deploy generate-code
```

## Frontend env setup

Copy `.env.example` to `.env` and fill in your public Supabase values.

These values are safe to expose in the browser:

- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`

## Important deployment rule

Never call OpenAI, Gemini, Claude, or any paid AI API directly from the frontend with a secret key.
Always send the request from your frontend to your own backend or Edge Function first, then call the AI provider from there.
