// Crea elementos de forma segura (textContent, nunca innerHTML con datos)
export function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') el.className = v;
    else if (k === 'style') el.setAttribute('style', v);
    else el.setAttribute(k, v);
  }
  el.append(...kids.filter(Boolean));
  return el;
}
