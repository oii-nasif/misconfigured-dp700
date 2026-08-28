/* Minimal DOM stub so the app's inline script runs headless under node.
   Elements fetched by id persist (their innerHTML survives re-renders);
   everything else returns inert throwaway nodes. */
function mkEl(id) {
  return {
    id, innerHTML: "", textContent: "", value: "", style: {}, dataset: {},
    disabled: false,
    addEventListener() {}, setAttribute() {}, removeAttribute() {},
    getAttribute() { return null; },
    appendChild() {}, removeChild() {}, insertAdjacentHTML() {},
    focus() {}, click() {}, select() {},
    classList: { toggle() {}, add() {}, remove() {} },
    querySelector() { return mkEl(id + "/q"); },
    querySelectorAll() { return []; }
  };
}
const __els = {};
const document = {
  getElementById: id => (__els[id] || (__els[id] = mkEl(id))),
  querySelectorAll: () => [],
  createElement: tag => mkEl("~" + tag),
  addEventListener() {},
  execCommand: () => true,
  body: mkEl("body"),
  activeElement: null
};
const __ls = {};
const localStorage = {
  setItem: (k, v) => { __ls[k] = String(v); },
  getItem: k => (k in __ls ? __ls[k] : null),
  removeItem: k => { delete __ls[k]; }
};
const window = {
  localStorage,
  __reduced: true,   // checks flip this to exercise the async acknowledgment timer
  addEventListener() {},
  scrollY: 0,
  scrollTo() {},
  matchMedia: () => ({ matches: window.__reduced })
};
const location = { hash: "", pathname: "/", search: "" };
const history = { replaceState() {} };
const navigator = {};
const matchMedia = window.matchMedia;
