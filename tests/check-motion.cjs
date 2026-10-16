// Run with: node tests/check-motion.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function element() {
  const classes = new Set();
  return {
    listeners: {}, animations: [], open: false, textContent: 'Test project', dataset: { project: 'test' },
    addEventListener(name, handler) { this.listeners[name] = handler; },
    classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name), toggle() {} },
    style: { setProperty() {} }, replaceChildren() {},
    showModal() { this.open = true; },
    close() { this.open = false; this.listeners.close?.(); },
    getBoundingClientRect() { return { left: 10, top: 10, right: 100, bottom: 100 }; },
    animate() {
      let finish;
      const animation = { finished: new Promise(resolve => { finish = resolve; }), finish: () => finish() };
      this.animations.push(animation);
      return animation;
    }
  };
}
async function check() {
  const dialog = element(), body = element(), trigger = element();
  const media = { matches: false, addEventListener() {} };
  const nodes = {
    '#project-dialog': dialog, '#dialog-title': element(), '#dialog-content': element(),
    '.dialog-scroll': element(), '.dialog-close': element(), '.hero': element(),
    '#project-test': { content: { cloneNode: () => ({}) } }
  };
  const context = vm.createContext({
    document: { body, querySelector: selector => nodes[selector], querySelectorAll: selector => selector.startsWith('.project-trigger') ? [trigger] : [], getAnimations: () => [] },
    matchMedia: () => media,
    IntersectionObserver: class { observe() {} unobserve() {} },
    requestAnimationFrame() {}, cancelAnimationFrame() {}
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/js/main.js'), 'utf8'), context);
  trigger.listeners.click();
  assert(dialog.open && body.classList.contains('modal-open'));
  vm.runInContext('closeDialog(); closeDialog();', context);
  assert.equal(dialog.animations.length, 2, 'Repeated close must not start duplicate animations');
  assert(dialog.open, 'Keep the modal and background lock until exit finishes');
  dialog.animations.at(-1).finish();
  await new Promise(resolve => setImmediate(resolve));
  assert(!dialog.open && !body.classList.contains('modal-open'), 'Exit must release the background lock');
  media.matches = true;
  trigger.listeners.click();
  assert.equal(dialog.animations.length, 2, 'Reduced motion must skip entry animation');
  let prevented = false;
  dialog.listeners.cancel({ preventDefault() { prevented = true; } });
  assert(prevented && !dialog.open, 'Escape must close immediately with reduced motion');
  trigger.listeners.click();
  dialog.listeners.click({ target: dialog, clientX: 50, clientY: 50 });
  assert(dialog.open, 'Padding inside the dialog must not close it');
  dialog.listeners.click({ target: dialog, clientX: 0, clientY: 0 });
  assert(!dialog.open, 'Backdrop click must close the dialog');
  console.log('PASS: animated close, repeated clicks, background lock, reduced motion, Escape and backdrop.');
}
check().catch(error => { console.error(error); process.exitCode = 1; });
