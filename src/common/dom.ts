
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

/**
 * wrap callback with setTimeout inside Promise<T>
 * @param callback 
 * @returns 
 */
export async function promisify<T>(callback: () => T): Promise<T> {
  return new Promise<T>(resolve => {
    setTimeout(() => {
      const result = callback();
      resolve(result);
    }, 0);
  });
}

/**
 * calls empty setTimeout to force DOM refresh
 */
export async function runEmptyTimeout() {
  await promisify(() => undefined);
}
