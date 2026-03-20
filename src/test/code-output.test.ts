import { describe, expect, it } from "vitest";
import { buildStandaloneHtml } from "@/lib/code-output";

describe("buildStandaloneHtml", () => {
  it("builds a single html document from separate html css and js parts", () => {
    const document = buildStandaloneHtml({
      html: "<main><h1>Hello</h1></main>",
      tailwind: "body { color: red; }",
      javascript: "console.log('ready');",
      python: "",
    });

    expect(document).toContain("<style>body { color: red; }</style>");
    expect(document).toContain("<script>console.log('ready');</script>");
    expect(document).toContain("<main><h1>Hello</h1></main>");
  });

  it("injects styles and scripts into a full html document", () => {
    const document = buildStandaloneHtml({
      html: "<!DOCTYPE html><html><head><title>Test</title></head><body><div>App</div></body></html>",
      tailwind: ".app { display: grid; }",
      javascript: "window.appLoaded = true;",
      python: "",
    });

    expect(document).toContain("<title>Test</title><style>.app { display: grid; }</style></head>");
    expect(document).toContain("<div>App</div><script>window.appLoaded = true;</script></body>");
  });
});
