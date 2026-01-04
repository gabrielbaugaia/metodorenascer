import DOMPurify from "dompurify";

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Use this for any user-generated or AI-generated content that will be rendered as HTML.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr",
      "ul", "ol", "li",
      "strong", "em", "b", "i", "u",
      "span", "div",
      "a",
      "table", "thead", "tbody", "tr", "th", "td",
    ],
    ALLOWED_ATTR: ["class", "href", "target", "rel"],
    // Force all links to open in new tab and be secure
    ADD_ATTR: ["target", "rel"],
  });
}

/**
 * Formats markdown-like content from AI to safe HTML.
 * Converts common markdown patterns to HTML and sanitizes the result.
 */
export function formatAiContent(content: string, variant: "default" | "compact" = "default"): string {
  if (!content) return "";

  const headingClasses = variant === "compact" 
    ? {
        h2: "text-sm font-bold text-primary mt-3 mb-1",
        h3: "text-xs font-semibold text-foreground mt-2 mb-1",
        h4: "text-xs font-medium text-foreground mt-2 mb-0.5",
      }
    : {
        h2: "text-lg font-bold text-primary mt-4 mb-2",
        h3: "text-base font-semibold text-foreground mt-3 mb-1",
        h4: "text-sm font-medium text-foreground mt-2 mb-1",
      };

  let formatted = content
    // Headers
    .replace(/## (.*?)(\n|$)/g, `<h2 class="${headingClasses.h2}">$1</h2>`)
    .replace(/### (.*?)(\n|$)/g, `<h3 class="${headingClasses.h3}">$1</h3>`)
    .replace(/#### (.*?)(\n|$)/g, `<h4 class="${headingClasses.h4}">$1</h4>`)
    // Bold/italic
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^- (.*?)$/gm, '<li class="ml-4">$1</li>')
    .replace(/^(\d+)\. (.*?)$/gm, '<li class="ml-4 list-decimal">$2</li>')
    // Line breaks
    .replace(/\n/g, '<br/>');

  // Sanitize the formatted HTML
  return sanitizeHtml(formatted);
}

/**
 * Formats recipe content from AI with appropriate styling.
 */
export function formatRecipeContent(content: string): string {
  if (!content) return "";

  let formatted = content
    .replace(/## (.*?)(\n|$)/g, '<h2 class="text-lg font-bold text-foreground mt-4 mb-2">$1</h2>')
    .replace(/### (.*?)(\n|$)/g, '<h3 class="text-base font-semibold text-foreground mt-3 mb-1">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
    .replace(/^- (.*?)$/gm, '<li class="ml-4">$1</li>')
    .replace(/^(\d+)\. (.*?)$/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(/\n/g, '<br/>');

  return sanitizeHtml(formatted);
}
