import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type GenerateCodeRequest = {
  prompt?: unknown;
  model?: unknown;
  image?: unknown;
};

type GeneratedCodePayload = {
  html: string;
  css: string;
  javascript: string;
  explanation: string;
};

type GatewayMessageContent =
  | string
  | Array<{
      type?: string;
      text?: string;
    }>;

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  });

const systemPrompt = `You are an expert front-end developer AND world-class UI/UX designer. You have studied top-tier products such as Apple, Stripe, Linear, Vercel, and Awwwards-winning websites.

══════════ CRITICAL OUTPUT RULES ══════════

- Respond with ONLY a valid JSON object:
{"html":"...","css":"...","js":"...","explanation":"..."}
- No markdown, no code fences, no extra text

══════════ HTML/CSS/JS RULES ══════════

- HTML must be complete with <!DOCTYPE html>, <html>, <head>, <body>
- Include <meta name="viewport" content="width=device-width, initial-scale=1.0">
- Use <link rel="stylesheet" href="style.css"> in the head
- Use <script src="script.js"></script> before </body>
- CSS must be modern, responsive, valid, production-ready
- JavaScript must be vanilla ES6+
- Fully functional without external build tools

══════════ SPEC FOLLOWING RULES ══════════

- Every explicit requirement from the user must be satisfied unless technically impossible
- Do NOT change requested component type, page type, layout, or features
- Preserve all explicit dimensions, breakpoints, widths, heights, spacing, labels, text, colors, and animation requests
- Fixed canvas or target width like 1200px must be preserved
- Implement real animation if requested
- Express modern/minimal/glass/bold styling clearly if requested
- Make the smallest reasonable assumption for missing details
- Do NOT add unrelated sections or components

══════════ DESIGN QUALITY RULES ══════════

- Visually polished with strong spacing, hierarchy, and alignment
- Use system-ui font stack
- Keep code organized and readable
- Avoid placeholder comments

══════════ EDIT MODE RULES ══════════

- If user provides existing code OR refers to previous UI:
  - Modify only the existing code
  - DO NOT recreate or replace layout
  - Keep unchanged code intact
  - Only patch or add requested features (backgrounds, images, styles, spacing, icons)
- Think: "patch the code, do not recreate it"

══════════ ICON RULES (FONT AWESOME) ══════════

- If UI requires icons, use Font Awesome
- Include in <head>:
  <link rel="stylesheet" href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'>
- Use meaningful icons, solid style by default
- Keep size consistent and aligned
- Add icons without breaking layout

══════════ IMAGE RULES ══════════

- If user prompt implies images:
  - Include images using high-quality placeholders (Unsplash)
  - Maintain aspect ratios (16:9 hero, 1:1 cards)
  - Add alt attributes
  - Images must not overpower text
  - Overlay or gradient if needed for readability
  - Keep spacing and alignment intact

══════════ VISUAL DESIGN RULES ══════════

- Effects (glow, blur, shadow) controlled: strongest on 1-2 key elements
- Background must remain subtle
- Depth layers: Background -> Content -> Hero focus
- Typography hierarchy: one dominant line, supporting lines smaller/lighter
- Consistent spacing scale (8px,12px,16px,24px,32px)
- Clean, responsive layout (flex/grid)
- No overflow issues

══════════ EXPLANATION RULE ══════════

- Provide a short plain-English summary of key requirements followed in the "explanation" key`;

const buildUserPrompt = (prompt: string, hasImage: boolean) => `User request:
"${prompt.trim()}"

══════════ EXECUTION INSTRUCTIONS ══════════

- Identify non-negotiable requirements first
- Match requested layout, width, style, and animations closely
- Preserve exact measurements (e.g., 1200px)
- ${hasImage ? "An image is attached; use it as reference and align UI to it" : "No image attached; rely only on written request"}
- Return the final answer ONLY as the required JSON object`;

const buildUserMessage = (prompt: string, image?: string) => {
  const textPart = {
    type: "text",
    text: buildUserPrompt(prompt, Boolean(image)),
  };

  if (!image) {
    return textPart.text;
  }

  return [
    textPart,
    {
      type: "image_url",
      image_url: {
        url: image,
      },
    },
  ];
};

const extractGeneratedCode = (content: string): GeneratedCodePayload => {
  let cleaned = content.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse AI response:", cleaned);
    // Fallback regex attempt if parsing fails due to text surrounding JSON
    const jsonMatch = cleaned.match(/\{[\s\S]*"html"[\s\S]*"css"[\s\S]*"(?:javascript|js)"[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse generated code");
    }
    parsed = JSON.parse(jsonMatch[0]);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("AI response was not a JSON object");
  }

  const code = parsed as Record<string, unknown>;
  
  // Normalize keys (handle both 'js' and 'javascript' for robustness)
  const html = typeof code.html === "string" ? code.html : "";
  const css = typeof code.css === "string" ? code.css : "";
  const javascript = typeof code.javascript === "string" ? code.javascript : (typeof code.js === "string" ? code.js : "");
  const explanation = typeof code.explanation === "string" ? code.explanation : "";

  if (!html || !css || !javascript) {
    throw new Error("AI response was missing required code fields (html, css, javascript)");
  }

  return { html, css, javascript, explanation };
};

const getTextContent = (content: GatewayMessageContent | null | undefined) => {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .filter((item) => item?.type === "text" && typeof item.text === "string")
      .map((item) => item.text)
      .join("\n")
      .trim();
  }

  return "";
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = (await req.json()) as GenerateCodeRequest;
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const model = typeof body.model === "string" && body.model.trim() ? body.model : "google/gemini-3-flash-preview";
    const image = typeof body.image === "string" && body.image.trim() ? body.image : undefined;

    if (!prompt) {
      return jsonResponse({ error: "Missing prompt" }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: buildUserMessage(prompt, image) },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return jsonResponse({ error: "Rate limit exceeded. Please try again in a moment." }, 429);
      }
      if (response.status === 402) {
        return jsonResponse({ error: "Usage limit reached. Please add credits to continue." }, 402);
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return jsonResponse({ error: "AI generation failed" }, 500);
    }

    const data = await response.json();
    const content = getTextContent(data?.choices?.[0]?.message?.content as GatewayMessageContent | undefined);

    if (!content) {
      throw new Error("No content returned from AI");
    }

    const code = extractGeneratedCode(content);

    return jsonResponse({
      explanation: code.explanation,
      message: code.explanation || "Generated UI successfully.",
      code: {
        html: code.html,
        css: code.css,
        js: code.javascript,
        tailwind: code.css,
        javascript: code.javascript,
        python: "",
      },
    });
  } catch (e) {
    console.error("generate-code error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
