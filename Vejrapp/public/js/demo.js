const store = window.sessionStorage;
const getProfile = () => JSON.parse(store.getItem('profile') || '{}');

document.querySelectorAll('.js-user-name').forEach(el => { el.textContent = (getProfile().name || [])[0] || 'ven'; });

// save fields (except password), enable "Næste" when one style is picked, go to next screen
document.querySelectorAll('form[data-next], form[data-next-adult]').forEach(form => {
  const next = form.querySelector('.js-next');
  if (next) form.addEventListener('change', () => { next.disabled = form.querySelectorAll('.tags__input:checked').length !== 1; });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    data.delete('password');
    const profile = getProfile();
    for (const key of new Set(data.keys())) profile[key] = data.getAll(key);
    store.setItem('profile', JSON.stringify(profile));
    location.href = data.has('age') ? (Number(data.get('age')) < 16 ? form.dataset.nextChild : form.dataset.nextAdult) : form.dataset.next;
  });
});

// buttons + arrow keys. TODO: save each choice (card.dataset.itemId, liked)
document.querySelectorAll('.js-swipe').forEach(swipe => {
  const cards = [...swipe.querySelectorAll('.swipe__card')];
  const counter = swipe.querySelector('.js-swipe-counter');
  let i = 0;
  const choose = liked => {
    if (i >= cards.length) return;
    cards[i].classList.replace('swipe__card--current', liked ? 'swipe__card--liked' : 'swipe__card--disliked');
    i++;
    if (i === cards.length) { setTimeout(() => { location.href = swipe.dataset.next; }, 350); return; }
    cards[i].classList.add('swipe__card--current');
    counter.textContent = i + 1;
  };
  swipe.addEventListener('click', e => { const b = e.target.closest('[data-action]'); if (b) choose(b.dataset.action === 'like'); });
  document.addEventListener('keydown', e => { if (e.key === 'ArrowRight') choose(true); if (e.key === 'ArrowLeft') choose(false); });
});