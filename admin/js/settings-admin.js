(async function () {
  const session = await DH_ADMIN.requireAuth();
  if (!session) return;

  mountAdminPage('parametres', 'Paramètres', `
    <div id="toast" hidden></div>
    <div class="admin-panel" style="max-width:560px">
      <div class="admin-panel__header"><h2>Contact & WhatsApp</h2></div>
      <form id="settingsForm" style="padding:1.5rem">
        <div class="form-group">
          <label for="whatsapp">Numéro WhatsApp (sans +)</label>
          <input type="text" id="whatsapp" required placeholder="212600000000">
          <small style="color:var(--text-muted)">Utilisé sur le site et les liens de commande produit.</small>
        </div>
        <button type="submit" class="btn btn--primary" style="width:auto;margin-top:0.5rem">Enregistrer</button>
      </form>
    </div>
    <div class="admin-panel" style="max-width:560px">
      <div class="admin-panel__header"><h2>Accès admin</h2></div>
      <div style="padding:1.5rem;font-size:0.9rem;color:var(--text-muted)">
        <p>Les comptes admin se créent dans <strong>Supabase Dashboard → Authentication → Users → Add user</strong>.</p>
        <p style="margin-top:0.75rem">Connecté en tant que : <strong id="currentEmail"></strong></p>
      </div>
    </div>
  `);

  document.getElementById('currentEmail').textContent = session.user.email;

  const client = DH_ADMIN.getClient();
  const { data } = await client.from('site_settings').select('value').eq('key', 'whatsapp').single();
  if (data) document.getElementById('whatsapp').value = data.value;

  document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = document.getElementById('whatsapp').value.trim();
    const { error } = await client.from('site_settings').upsert({ key: 'whatsapp', value }, { onConflict: 'key' });
    if (error) { toast(error.message, 'error'); return; }
    toast('Paramètres enregistrés', 'success');
  });

  function toast(msg, type) {
    const el = document.getElementById('toast');
    el.hidden = false; el.className = 'alert alert--' + type; el.textContent = msg;
    el.style.marginBottom = '1rem';
  }
})();
