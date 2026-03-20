import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `You are an expert frontend developer that turns a user's UI request into code.

You must treat the user's request as a spec, not inspiration.

CRITICAL OUTPUT RULE:
- Respond with ONLY a valid JSON object in this exact shape:
{"html":"...","css":"...","js":"...","explanation":"..."}
- No markdown
- No code fences
- No extra text before or after the JSON

CODE RULES:
- The HTML must be a complete document with <!DOCTYPE html>, <html>, <head>, and <body>
- Include <meta name="viewport" content="width=device-width, initial-scale=1.0">
- Use <link rel="stylesheet" href="style.css"> in the head
- Use <script src="script.js"></script> before </body>
- CSS must be valid, modern, responsive, and production-ready
- JavaScript must be vanilla ES6+
- The result must be fully functional without external build tools

SPEC FOLLOWING RULES:
- Every explicit user requirement is mandatory unless technically impossible in plain HTML/CSS/JS
- Never change the requested component type, page type, layout intent, or feature list
- Preserve explicit dimensions, breakpoints, widths, heights, spacing requests, labels, text, colors, animation requests, and style directions
- If the user requests a fixed canvas or target width like 1200px, reflect that intentionally in the layout
- If the user asks for animation, implement real animation behavior in CSS and/or JavaScript
- If the user asks for "modern", "minimal", "glass", "bold", or similar visual direction, express that clearly in the design
- If a detail is missing, make the smallest reasonable assumption instead of inventing extra features
- Do not add unrelated sections, components, or behaviors the user did not ask for

QUALITY RULES:
- Make the result visually polished with strong spacing, hierarchy, and alignment
- Use system-ui font stack
- Keep code organized and readable
- Avoid placeholder comments like "add more styles here"

EXPLANATION RULE:
- "explanation" must be a short plain-English summary of the key requirements you followed`;

const buildUserPrompt = (prompt: string, hasImage: boolean) => `User request:
${prompt.trim()}

Execution instructions:
- First identify the non-negotiable requirements from the request and satisfy them in the code
- Match the requested layout, width, style, and animation behavior as closely as possible
- If the request includes exact measurements like 1200px, preserve them in the implementation
- ${hasImage ? "An image is attached, so use it as a visual reference and keep the generated UI aligned to it" : "No image is attached, so rely on the written request without inventing extra sections"}
- Return the final answer only as the required JSON object`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, model, image } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Missing prompt" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
        model: model || "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: buildUserPrompt(prompt, Boolean(image)) },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from AI");
    }

    // Parse the JSON response - handle potential markdown code fences
    let cleaned = content.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    let code;
    try {
      code = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", cleaned);
      // Try to extract JSON from the response
      const jsonMatch = cleaned.match(/\{[\s\S]*"html"[\s\S]*"css"[\s\S]*"js"[\s\S]*\}/);
      if (jsonMatch) {
        code = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse generated code");
      }
    }

    if (
      !code ||
      typeof code !== "object" ||
      typeof code.html !== "string" ||
      typeof code.css !== "string" ||
      typeof code.js !== "string"
    ) {
      throw new Error("AI response was missing required code fields");
    }

    return new Response(JSON.stringify({ code }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-code error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
