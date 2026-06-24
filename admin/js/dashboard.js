(async function () {
  const session = await DH_ADMIN.requireAuth();
  if (!session) return;

  mountAdminPage('dashboard', 'Tableau de bord', `
    <div class="stats-grid" id="statsGrid">
      <div class="stat-card"><div class="stat-card__value" id="statTotal">—</div><div class="stat-card__label">Produits total</div></div>
      <div class="stat-card"><div class="stat-card__value" id="statStock">—</div><div class="stat-card__label">En stock</div></div>
      <div class="stat-card"><div class="stat-card__value" id="statOut">—</div><div class="stat-card__label">Épuisés</div></div>
      <div class="stat-card"><div class="stat-card__value" id="statCollections">—</div><div class="stat-card__label">Collections</div></div>
      <div class="stat-card"><div class="stat-card__value" id="statViews">—</div><div class="stat-card__label">Vues produits (30j)</div></div>
      <div class="stat-card"><div class="stat-card__value" id="statWhatsapp">—</div><div class="stat-card__label">Clics WhatsApp (30j)</div></div>
      <div class="stat-card"><div class="stat-card__value" id="statAppointments">—</div><div class="stat-card__label">Nouvelles demandes</div></div>
    </div>
    <div class="admin-panel">
      <div class="admin-panel__header"><h2>Produits par collection</h2></div>
      <div style="padding:1.5rem" id="collectionBars"></div>
    </div>
    <div class="admin-panel">
      <div class="admin-panel__header"><h2>Activité récente</h2></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Événement</th><th>Produit / Collection</th></tr></thead>
          <tbody id="recentEvents"><tr><td colspan="3">Chargement…</td></tr></tbody>
        </table>
      </div>
    </div>
  `);

  const client = DH_ADMIN.getClient();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  const [
    { data: products },
    { data: collections },
    { data: events },
    { count: viewCount },
    { count: waCount },
    { count: newAppointments },
  ] = await Promise.all([
    client.from('products').select('id, collection_slug, available, price'),
    client.from('collections').select('slug, name'),
    client.from('analytics_events').select('*').order('created_at', { ascending: false }).limit(20),
    client.from('analytics_events').select('*', { count: 'exact', head: true }).eq('event_type', 'product_view').gte('created_at', sinceIso),
    client.from('analytics_events').select('*', { count: 'exact', head: true }).eq('event_type', 'whatsapp_click').gte('created_at', sinceIso),
    client.from('appointment_requests').select('*', { count: 'exact', head: true }).eq('status', 'new'),
  ]);

  const list = products || [];
  const inStock = list.filter((p) => p.available).length;

  document.getElementById('statTotal').textContent = list.length;
  document.getElementById('statStock').textContent = inStock;
  document.getElementById('statOut').textContent = list.length - inStock;
  document.getElementById('statCollections').textContent = (collections || []).length;
  document.getElementById('statViews').textContent = viewCount || 0;
  document.getElementById('statWhatsapp').textContent = waCount || 0;
  const apptEl = document.getElementById('statAppointments');
  if (apptEl) apptEl.textContent = newAppointments ?? 0;

  const colMap = {};
  (collections || []).forEach((c) => { colMap[c.slug] = c.name; });

  const counts = {};
  list.forEach((p) => {
    counts[p.collection_slug] = (counts[p.collection_slug] || 0) + 1;
  });
  const maxCount = Math.max(...Object.values(counts), 1);
  const barsEl = document.getElementById('collectionBars');
  barsEl.innerHTML = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([slug, n]) => `
      <div class="collection-bar">
        <span class="collection-bar__name">${colMap[slug] || slug}</span>
        <div class="collection-bar__track"><div class="collection-bar__fill" style="width:${(n / maxCount) * 100}%"></div></div>
        <span class="collection-bar__count">${n}</span>
      </div>`).join('');

  const tbody = document.getElementById('recentEvents');
  if (!events?.length) {
    tbody.innerHTML = '<tr><td colspan="3">Aucune activité enregistrée pour le moment.</td></tr>';
  } else {
    const labels = {
      product_view: 'Vue produit',
      whatsapp_click: 'Clic WhatsApp',
      catalog_view: 'Vue catalogue',
    };
    tbody.innerHTML = events.map((ev) => {
      const date = new Date(ev.created_at).toLocaleString('fr-MA');
      const detail = ev.product_id || ev.collection_slug || '—';
      return `<tr><td>${date}</td><td>${labels[ev.event_type] || ev.event_type}</td><td>${detail}</td></tr>`;
    }).join('');
  }
})();
