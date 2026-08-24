(() => {
  const form = document.getElementById('f');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const role = document.getElementById('role');
  const out = document.getElementById('out');

  if (!form || !email || !password || !out) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    out.textContent = 'Création...';

    try {
      const response = await fetch('/api/admin/accounts', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          ...(window.NOVUS_CSRF ? { 'x-csrf-token': window.NOVUS_CSRF } : {})
        },
        body: JSON.stringify({
          email: email.value.trim(),
          password: password.value,
          role: role ? role.value : 'OWNER'
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Erreur HTTP ${response.status}`);

      out.textContent = 'Compte créé ✓ Vous pouvez maintenant vous connecter.';
      form.reset();
      if (data.csrf) window.NOVUS_CSRF = data.csrf;
    } catch (error) {
      out.textContent = error?.message || 'Une erreur est survenue.';
    }
  });
})();
