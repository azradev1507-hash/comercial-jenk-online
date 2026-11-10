// Utilidades de DOM seguras: texto con textContent, nunca innerHTML con datos de la API.
export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value == null) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) {
    if (child == null) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export const getParam = (name) => new URLSearchParams(location.search).get(name);

// Evita redirecciones abiertas: solo rutas internas ("/algo"), nunca "//otro.com" ni URLs absolutas.
export function safePath(value, fallback = '/') {
  if (typeof value !== 'string') return fallback;
  return value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') ? value : fallback;
}
