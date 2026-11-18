/** `react/jsx-runtime` for the harness: an element is a plain {type, props} object. */
export function jsx(type, props) {
  return { type, props: props || {} };
}
export const jsxs = jsx;
export const jsxDEV = jsx;
export const Fragment = 'Fragment';
