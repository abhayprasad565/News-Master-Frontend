/**
 * Sets or updates a <meta> tag by name or property.
 */
export function setMetaTag(nameOrProperty: string, content: string): void {
  const isProperty = nameOrProperty.startsWith("og:") ||
    nameOrProperty.startsWith("article:") ||
    nameOrProperty.startsWith("twitter:");

  const selector = isProperty
    ? `meta[property="${nameOrProperty}"]`
    : `meta[name="${nameOrProperty}"]`;

  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    if (isProperty) {
      el.setAttribute("property", nameOrProperty);
    } else {
      el.setAttribute("name", nameOrProperty);
    }
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * Sets the <link rel="canonical"> href, creating the element if missing.
 */
export function setCanonical(url: string): void {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", url);
}

/**
 * Removes the <link rel="canonical"> element if present.
 */
export function removeCanonical(): void {
  document.querySelector('link[rel="canonical"]')?.remove();
}

/**
 * Injects a JSON-LD structured data script block.
 * Replaces any existing block with the same id.
 */
export function setJsonLd(id: string, data: object): void {
  const existingId = `jsonld-${id}`;
  document.getElementById(existingId)?.remove();
  const el = document.createElement("script");
  el.id = existingId;
  el.type = "application/ld+json";
  el.textContent = JSON.stringify(data);
  document.head.appendChild(el);
}

/**
 * Removes a JSON-LD structured data script block by id.
 */
export function removeJsonLd(id: string): void {
  document.getElementById(`jsonld-${id}`)?.remove();
}
