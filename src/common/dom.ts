
/**
 * create HTML elements from HTML string
 * @param html HTML string
 * @returns HTML element array
 */
export function htmlToElements(html: string): HTMLElement[] {
  const template = document.createElement("template");
  template.innerHTML = html;
  const nodes: HTMLElement[] = [];
  template.content.childNodes.forEach(x => {
    if (x instanceof HTMLElement) { 
      nodes.push(x);
    }
  });
  return nodes;
}
