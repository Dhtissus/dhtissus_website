(async function () {
  const session = await DH_ADMIN.requireAuth();
  if (!session) return;

  const PROJECT_LABELS = {
    mariage: 'Mariage',
    caftan: 'Caftan',
    soiree: 'Soirée',
    styliste: 'Styliste / Créateur',
    autre: 'Autre projet',
  };

  const STATUS_LABELS = {
    new: 'Nouveau',
    contacted: 'Contacté',
    confirmed: 'Confirmé',
    cancelled: 'Annulé',
  };

  const STATUS_BADGE = {
    new: 'badge--new',
    contacted: 'badge--contacted',
    confirmed: 'badge--confirmed',
    cancelled: 'badge--cancelled',
  };

  mountAdminPage('formulaire', 'Demandes rendez-vous', `
    <div id="toast" hidden></div>
    <div class="admin-panel">
      <div class="admin-panel__header">
        <h2>Formulaire « Prendre rendez-vous »</h2>
        <div class="admin-toolbar">
          <select id="filterStatus">
            <option value="">Tous les statuts</option>
            <option value="new">Nouveau</option>
            <option value="contacted">Contacté</option>
            <option value="confirmed">Confirmé</option>
            <option value="cancelled">Annulé</option>
          </select>
          <button type="button" class="btn btn--sm" id="refreshBtn" style="width:auto">Actualiser</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Nom</th>
              <th>Téléphone</th>
              <th>Projet</th>
              <th>Message</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="requestsTable"><tr><td colspan="7">Chargement…</td></tr></tbody>
        </table>
      </div>
    </div>
  `);

  const client = DH_ADMIN.getClient();
  const tbody = document.getElementById('requestsTable');
  const filterStatus = document.getElementById('filterStatus');
  const toast = document.getElementById('toast');

  let requests = [];

  function showToast(msg, isError) {
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    toast.style.background = isError ? 'var(--danger)' : 'var(--success)';
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { toast.hidden = true; }, 2800);
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatPhoneLink(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    const wa = digits.startsWith('212') ? digits : `212${digits.replace(/^0/, '')}`;
    return `https://wa.me/${wa}`;
  }

  function renderTable() {
    const statusFilter = filterStatus.value;
    const list = statusFilter
      ? requests.filter((r) => r.status === statusFilter)
      : requests;

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="7">Aucune demande pour le moment.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map((r) => {
      const date = new Date(r.created_at).toLocaleString('fr-MA');
      const project = PROJECT_LABELS[r.project_type] || r.project_type;
      const status = r.status || 'new';
      const msg = r.message ? escapeHtml(r.message) : '—';
      const waHref = formatPhoneLink(r.phone);

      return `
        <tr data-id="${r.id}">
          <td>${date}</td>
          <td><strong>${escapeHtml(r.full_name)}</strong></td>
          <td>
            <a href="${waHref}" target="_blank" rel="noopener">${escapeHtml(r.phone)}</a>
          </td>
          <td>${escapeHtml(project)}</td>
          <td class="message-cell">${msg}</td>
          <td>
            <span class="badge ${STATUS_BADGE[status] || 'badge--new'}">${STATUS_LABELS[status] || status}</span>
          </td>
          <td>
            <div class="table-actions">
              <select class="status-select" data-id="${r.id}" aria-label="Changer le statut">
                ${Object.entries(STATUS_LABELS).map(([val, label]) =>
                  `<option value="${val}"${status === val ? ' selected' : ''}>${label}</option>`
                ).join('')}
              </select>
              <button type="button" class="btn btn--danger btn--sm del-btn" data-id="${r.id}" aria-label="Supprimer la demande">Suppr.</button>
            </div>
          </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('.status-select').forEach((sel) => {
      sel.addEventListener('change', async () => {
        const id = Number(sel.dataset.id);
        const newStatus = sel.value;
        const prev = requests.find((r) => r.id === id)?.status;
        sel.disabled = true;

        const { error } = await client
          .from('appointment_requests')
          .update({ status: newStatus })
          .eq('id', id);

        sel.disabled = false;

        if (error) {
          sel.value = prev || 'new';
          showToast(error.message || 'Mise à jour échouée', true);
          return;
        }

        const row = requests.find((r) => r.id === id);
        if (row) row.status = newStatus;
        showToast('Statut mis à jour');
        renderTable();
      });
    });

    tbody.querySelectorAll('.del-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.dataset.id);
        const row = requests.find((r) => r.id === id);
        const name = row?.full_name || 'cette demande';
        if (!confirm(`Supprimer la demande de « ${name} » ? Cette action est irréversible.`)) return;

        btn.disabled = true;

        const { error } = await client
          .from('appointment_requests')
          .delete()
          .eq('id', id);

        if (error) {
          btn.disabled = false;
          showToast(error.message || 'Suppression échouée', true);
          return;
        }

        requests = requests.filter((r) => r.id !== id);
        showToast('Demande supprimée');
        renderTable();
      });
    });
  }

  async function loadRequests() {
    tbody.innerHTML = '<tr><td colspan="7">Chargement…</td></tr>';

    const { data, error } = await client
      .from('appointment_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      tbody.innerHTML = `<tr><td colspan="7">Erreur : ${escapeHtml(error.message)}</td></tr>`;
      return;
    }

    requests = data || [];
    renderTable();
  }

  filterStatus.addEventListener('change', renderTable);
  document.getElementById('refreshBtn').addEventListener('click', loadRequests);

  await loadRequests();
})();
