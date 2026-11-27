/** Restore route-owned head tags when leaving a public content page. */
export function capturePublicMetadata(): () => void {
  const selector = 'title, meta[name="description"], meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"]';
  const original = Array.from(document.head.querySelectorAll(selector), (node) => node.cloneNode(true));
  return () => {
    document.head.querySelectorAll(selector).forEach((node) => node.remove());
    original.forEach((node) => document.head.appendChild(node.cloneNode(true)));
  };
}