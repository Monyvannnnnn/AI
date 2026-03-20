import type { GeneratedCode } from "@/types/chat";

const HEAD_CLOSE_TAG = /<\/head>/i;
const BODY_CLOSE_TAG = /<\/body>/i;
const HTML_TAG = /<html[\s>]/i;

export const looksLikeCss = (code: string) =>
  /[{][^}]*[:;][^}]*[}]|^@media|^@import|^[.#a-zA-Z][\w\s,:>~#[\].()-]*\s*\{/m.test(code);

const injectIntoDocument = (document: string, headContent: string, scripts: string) => {
  let output = document;

  if (headContent) {
    output = HEAD_CLOSE_TAG.test(output) ? output.replace(HEAD_CLOSE_TAG, `${headContent}</head>`) : `${headContent}${output}`;
  }

  if (scripts) {
    const scriptTag = `<script>${scripts}<\/script>`;
    output = BODY_CLOSE_TAG.test(output) ? output.replace(BODY_CLOSE_TAG, `${scriptTag}</body>`) : `${output}${scriptTag}`;
  }

  return output;
};

export const buildStandaloneHtml = (generatedCode: GeneratedCode) => {
  const markup = generatedCode.html || generatedCode.tailwind || "";
  const styles = looksLikeCss(generatedCode.tailwind) ? generatedCode.tailwind : "";
  const tailwindCdn = generatedCode.tailwind && !looksLikeCss(generatedCode.tailwind) ? '<script src="https://cdn.tailwindcss.com"></script>' : "";
  const scripts = generatedCode.javascript || "";
  const headContent = `${tailwindCdn}${styles ? `<style>${styles}</style>` : ""}`;

  if (HTML_TAG.test(markup)) {
    return injectIntoDocument(markup, headContent, scripts);
  }

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${headContent}
  </head>
  <body>${markup}${scripts ? `<script>${scripts}<\/script>` : ""}</body>
</html>`;
};
