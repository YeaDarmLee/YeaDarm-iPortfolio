const projectDialog = document.querySelector('#project-dialog');
const dialogTitle = document.querySelector('#dialog-title');
const dialogContent = document.querySelector('#dialog-content');
const dialogScroll = document.querySelector('.dialog-scroll');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const motion = { duration: 300, easing: 'cubic-bezier(.2,.7,.2,1)' };
let closingDialog = false;

for (const trigger of document.querySelectorAll('.project-trigger, .career-trigger, .archive-trigger')) {
  trigger.addEventListener('click', () => {
    const template = document.querySelector(`#project-${trigger.dataset.project}`);
    dialogTitle.textContent = trigger.textContent;
    dialogContent.replaceChildren(template.content.cloneNode(true));
    projectDialog.showModal();
    document.body.classList.add('modal-open');
    dialogScroll.scrollTop = 0;
    if (!reducedMotion.matches) {
      projectDialog.animate([
        { opacity: 0, transform: 'translateY(20px) scale(.98)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' }
      ], motion);
    }
  });
}

function closeDialog() {
  if (!projectDialog.open || closingDialog) return;
  if (reducedMotion.matches) { projectDialog.close(); return; }
  closingDialog = true;
  projectDialog.classList.add('is-closing');
  projectDialog.animate([
    { opacity: 1, transform: 'translateY(0) scale(1)' },
    { opacity: 0, transform: 'translateY(12px) scale(.985)' }
  ], { ...motion, duration: 180 }).finished.catch(() => {}).then(() => {
    projectDialog.close();
    projectDialog.classList.remove('is-closing');
    closingDialog = false;
  });
}

document.querySelector('.dialog-close').addEventListener('click', closeDialog);
projectDialog.addEventListener('cancel', (event) => { event.preventDefault(); closeDialog(); });
projectDialog.addEventListener('click', (event) => {
  if (event.target !== projectDialog) return;
  const bounds = projectDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog();
});
projectDialog.addEventListener('close', () => document.body.classList.remove('modal-open'));

// Content stays visible without JavaScript; animate each block only on its first appearance.
const revealObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    revealObserver.unobserve(entry.target);
    if (!reducedMotion.matches) entry.target.animate([
      { opacity: 0, transform: 'translateY(22px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { ...motion, duration: 650 });
  }
}, { threshold: 0.08 });
document.querySelectorAll('.section-heading, .archive-item, .project, .career-intro, .career-item, .about-layout, .capabilities article, .contact-row, .email-link').forEach(element => revealObserver.observe(element));

const hero = document.querySelector('.hero');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
let pointerFrame = 0;
hero.addEventListener('pointermove', (event) => {
  if (reducedMotion.matches || !finePointer.matches) return;
  cancelAnimationFrame(pointerFrame);
  pointerFrame = requestAnimationFrame(() => {
    const bounds = hero.getBoundingClientRect();
    hero.style.setProperty('--pointer-x', `${(event.clientX / bounds.width - .5) * 12}px`);
    hero.style.setProperty('--pointer-y', `${((event.clientY - bounds.top) / bounds.height - .5) * 8}px`);
  });
});
function resetHeroPointer() {
  cancelAnimationFrame(pointerFrame);
  hero.style.setProperty('--pointer-x', '0px');
  hero.style.setProperty('--pointer-y', '0px');
}
hero.addEventListener('pointerleave', resetHeroPointer);
reducedMotion.addEventListener('change', () => {
  resetHeroPointer();
  if (reducedMotion.matches) {
    for (const animation of document.getAnimations()) animation.cancel();
  }
});
new IntersectionObserver(([entry]) => {
  hero.classList.toggle('hero-paused', !entry.isIntersecting);
}).observe(hero);

const emailCopy = document.querySelector('button.email-link');
const copyToast = document.querySelector('.copy-toast');
let copyToastTimer;
if (emailCopy && copyToast) emailCopy.addEventListener('click', async () => {
  const email = emailCopy.textContent.trim();
  let copied = false;
  try {
    await navigator.clipboard.writeText(email);
    copied = true;
  } catch {
    // Local file previews and older browsers may lack the Clipboard API.
    const field = document.createElement('textarea');
    field.value = email;
    field.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.append(field);
    field.select();
    try { copied = document.execCommand('copy'); } catch {}
    field.remove();
    emailCopy.focus();
  }
  clearTimeout(copyToastTimer);
  copyToast.textContent = copied ? '이메일 주소가 복사되었습니다.' : '복사하지 못했습니다. 다시 시도해 주세요.';
  copyToast.classList.add('is-visible');
  copyToastTimer = setTimeout(() => copyToast.classList.remove('is-visible'), 2600);
});
