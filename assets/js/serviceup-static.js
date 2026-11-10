(() => {
  const form = document.querySelector('[data-serviceup-assessment]');
  if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    const total = [...new FormData(form).values()].reduce((sum, value) => sum + Number(value), 0);
    const results = form.querySelector('.assessment-results');
    form.querySelector('[data-total]').textContent = total;
    results.hidden = false;
    results.scrollIntoView({behavior:'smooth',block:'center'});
  });
  form.addEventListener('reset', () => {
    const results = form.querySelector('.assessment-results');
    results.hidden = true;
    form.querySelector('[data-total]').textContent = '0';
  });
})();
