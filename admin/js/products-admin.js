(async function () {
  const session = await DH_ADMIN.requireAuth();
  if (!session) return;

  let products = [];
  let collections = [];
  let colMap = {};

  mountAdminPage('produits', 'Gestion des produits', `
    <div id="toast" hidden></div>
    <div class="admin-panel">
      <div class="admin-panel__header">
        <h2>Catalogue</h2>
        <div class="admin-toolbar">
          <input type="search" id="searchInput" placeholder="Rechercher…">
          <select id="filterCollection"><option value="">Toutes collections</option></select>
          <select id="filterStock">
            <option value="">Tous stocks</option>
            <option value="in">En stock</option>
            <option value="out">Épuisés</option>
          </select>
          <button class="btn btn--primary btn--sm" id="addProductBtn" style="width:auto">+ Ajouter</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Réf.</th>
              <th>Nom</th>
              <th>Collection</th>
              <th>Prix (MAD)</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="productsTable"><tr><td colspan="6">Chargement…</td></tr></tbody>
        </table>
      </div>
    </div>

    <div class="modal-overlay" id="productModal" hidden>
      <div class="modal" role="dialog">
        <div class="modal__header">
          <h2 id="modalTitle">Produit</h2>
          <button type="button" class="modal-close" id="closeModal">&times;</button>
        </div>
        <form id="productForm">
          <div class="modal__body">
            <div class="form-row">
              <div class="form-group">
                <label for="fId">Référence (id) *</label>
                <input type="text" id="fId" required pattern="[a-z0-9-]+" placeholder="velours-007">
              </div>
              <div class="form-group">
                <label for="fCollection">Collection principale *</label>
                <select id="fCollection" required></select>
              </div>
            </div>
            <div class="form-group">
              <label for="fName">Nom *</label>
              <input type="text" id="fName" required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="fPrice">Prix (MAD) *</label>
                <input type="number" id="fPrice" required min="0" step="1">
              </div>
              <div class="form-group">
                <label for="fUnit">Unité</label>
                <select id="fUnit"><option value="coupon">coupon</option><option value="mètre">mètre</option></select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="fCoupon">Coupon (m)</label>
                <input type="number" id="fCoupon" min="0" step="0.1">
              </div>
              <div class="form-group">
                <label for="fWidth">Largeur (m)</label>
                <input type="number" id="fWidth" min="0" step="0.01">
              </div>
            </div>
            <div class="form-group">
              <label for="fExtraCollections">Collections supplémentaires (virgules)</label>
              <input type="text" id="fExtraCollections" placeholder="mariage, caftan, haute-couture">
            </div>
            <div class="form-group image-upload-group">
              <label>Photo principale</label>
              <div class="image-upload-box">
                <img id="mainImagePreview" class="image-preview" hidden alt="Aperçu">
                <div class="image-upload-actions">
                  <input type="file" id="fImageFile" accept="image/png,image/jpeg,image/webp" hidden>
                  <button type="button" class="btn btn--outline btn--sm" id="pickMainImage">📁 Choisir une photo</button>
                  <button type="button" class="btn btn--outline btn--sm" id="clearMainImage">Supprimer</button>
                  <span id="mainImageStatus" class="upload-status"></span>
                </div>
              </div>
              <input type="hidden" id="fImage">
            </div>
            <div class="form-group image-upload-group">
              <label>Galerie photos</label>
              <p class="gallery-hint">Cliquez sur une photo pour la sélectionner · ✕ pour supprimer directement</p>
              <div class="image-gallery-preview" id="galleryPreview"></div>
              <div class="image-upload-actions">
                <input type="file" id="fGalleryFiles" accept="image/png,image/jpeg,image/webp" multiple hidden>
                <button type="button" class="btn btn--outline btn--sm" id="pickGallery">📁 Ajouter des photos</button>
                <button type="button" class="btn btn--danger btn--sm" id="deleteGalleryPhoto" disabled>Supprimer la sélection</button>
                <span id="galleryStatus" class="upload-status"></span>
              </div>
              <textarea id="fImages" rows="2" hidden></textarea>
            </div>
            <div class="form-group">
              <label for="fColors">Coloris (virgules)</label>
              <input type="text" id="fColors">
            </div>
            <div class="form-group">
              <label for="fDescription">Description courte *</label>
              <textarea id="fDescription" required rows="3"></textarea>
            </div>
            <div class="form-group">
              <label for="fDetails">Description longue</label>
              <textarea id="fDetails" rows="4"></textarea>
            </div>
            <div class="form-group">
              <label for="fFeatures">Points forts (un par ligne)</label>
              <textarea id="fFeatures" rows="3"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="fBrand">Marque</label>
                <input type="text" id="fBrand">
              </div>
              <div class="form-group">
                <label for="fAvailable">Disponibilité</label>
                <select id="fAvailable"><option value="true">En stock</option><option value="false">Épuisé</option></select>
              </div>
            </div>
          </div>
          <div class="modal__footer">
            <button type="button" class="btn btn--outline" id="cancelModal">Annuler</button>
            <button type="submit" class="btn btn--primary" style="width:auto">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  `);

  const client = DH_ADMIN.getClient();
  await loadData();

  const mainImageUi = DH_UPLOAD.bindMainImagePicker({
    pickBtnId: 'pickMainImage',
    fileInputId: 'fImageFile',
    hiddenInputId: 'fImage',
    previewId: 'mainImagePreview',
    statusId: 'mainImageStatus',
  });

  const galleryUi = DH_UPLOAD.bindGalleryPicker({
    pickBtnId: 'pickGallery',
    fileInputId: 'fGalleryFiles',
    textareaId: 'fImages',
    previewId: 'galleryPreview',
    statusId: 'galleryStatus',
    deleteBtnId: 'deleteGalleryPhoto',
  });

  document.getElementById('clearMainImage').addEventListener('click', () => {
    mainImageUi.clearImage();
    document.getElementById('mainImageStatus').textContent = 'Photo principale supprimée';
    document.getElementById('mainImageStatus').className = 'upload-status upload-status--ok';
  });

  bindEvents();
  renderTable();

  async function loadData() {
    const [{ data: prods }, { data: cols }] = await Promise.all([
      client.from('products').select('*').order('name'),
      client.from('collections').select('*').order('sort_order'),
    ]);
    products = prods || [];
    collections = cols || [];
    colMap = {};
    collections.forEach((c) => { colMap[c.slug] = c.name; });

    const filterCol = document.getElementById('filterCollection');
    const fCol = document.getElementById('fCollection');
    collections.forEach((c) => {
      filterCol.innerHTML += `<option value="${c.slug}">${c.name}</option>`;
      fCol.innerHTML += `<option value="${c.slug}">${c.name}</option>`;
    });
  }

  function bindEvents() {
    document.getElementById('searchInput').addEventListener('input', renderTable);
    document.getElementById('filterCollection').addEventListener('change', renderTable);
    document.getElementById('filterStock').addEventListener('change', renderTable);
    document.getElementById('addProductBtn').addEventListener('click', () => openModal());
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelModal').addEventListener('click', closeModal);
    document.getElementById('productModal').addEventListener('click', (e) => {
      if (e.target.id === 'productModal') closeModal();
    });
    document.getElementById('productForm').addEventListener('submit', saveProduct);
  }

  function getFiltered() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    const col = document.getElementById('filterCollection').value;
    const stock = document.getElementById('filterStock').value;

    return products.filter((p) => {
      if (col && p.collection_slug !== col && !(p.extra_collections || []).includes(col)) return false;
      if (stock === 'in' && !p.available) return false;
      if (stock === 'out' && p.available) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function renderTable() {
    const tbody = document.getElementById('productsTable');
    const filtered = getFiltered();
    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="6">Aucun produit trouvé.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map((p) => `
      <tr data-id="${p.id}">
        <td><code>${p.id}</code></td>
        <td>${esc(p.name)}</td>
        <td>${colMap[p.collection_slug] || p.collection_slug}</td>
        <td>
          <input type="number" class="price-input" value="${p.price}" data-id="${p.id}" min="0">
          <small style="color:var(--text-muted)">/ ${p.unit}</small>
        </td>
        <td><span class="badge ${p.available ? 'badge--in' : 'badge--out'}">${p.available ? 'Stock' : 'Épuisé'}</span></td>
        <td class="table-actions">
          <button class="btn btn--outline btn--sm edit-btn" data-id="${p.id}">Modifier</button>
          <button class="btn btn--danger btn--sm del-btn" data-id="${p.id}">Suppr.</button>
        </td>
      </tr>`).join('');

    tbody.querySelectorAll('.price-input').forEach((input) => {
      input.addEventListener('change', async () => {
        const id = input.dataset.id;
        const price = Number(input.value);
        const { error } = await client.from('products').update({ price }).eq('id', id);
        if (error) { toast(error.message, 'error'); return; }
        const p = products.find((x) => x.id === id);
        if (p) p.price = price;
        toast('Prix mis à jour', 'success');
      });
    });

    tbody.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', () => openModal(btn.dataset.id));
    });

    tbody.querySelectorAll('.del-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Supprimer ce produit ?')) return;
        const { error } = await client.from('products').delete().eq('id', btn.dataset.id);
        if (error) { toast(error.message, 'error'); return; }
        products = products.filter((p) => p.id !== btn.dataset.id);
        renderTable();
        toast('Produit supprimé', 'success');
      });
    });
  }

  let editingId = null;

  function openModal(id) {
    editingId = id || null;
    document.getElementById('modalTitle').textContent = id ? 'Modifier le produit' : 'Nouveau produit';
    document.getElementById('fId').disabled = Boolean(id);

    if (id) {
      const p = products.find((x) => x.id === id);
      if (!p) return;
      document.getElementById('fId').value = p.id;
      document.getElementById('fCollection').value = p.collection_slug;
      document.getElementById('fName').value = p.name;
      document.getElementById('fPrice').value = p.price;
      document.getElementById('fUnit').value = p.unit || 'coupon';
      document.getElementById('fCoupon').value = p.coupon ?? '';
      document.getElementById('fWidth').value = p.width ?? '';
      document.getElementById('fExtraCollections').value = (p.extra_collections || []).join(', ');
      document.getElementById('fImage').value = p.image || '';
      document.getElementById('fImages').value = (p.images || []).join('\n');
      mainImageUi.showPreview(p.image || '');
      galleryUi.renderPreview();
      document.getElementById('fColors').value = (p.colors || []).join(', ');
      document.getElementById('fDescription').value = p.description || '';
      document.getElementById('fDetails').value = p.details || '';
      document.getElementById('fFeatures').value = (p.features || []).join('\n');
      document.getElementById('fBrand').value = p.brand || '';
      document.getElementById('fAvailable').value = p.available ? 'true' : 'false';
    } else {
      document.getElementById('productForm').reset();
      document.getElementById('fId').disabled = false;
      mainImageUi.showPreview('');
      galleryUi.renderPreview();
      galleryUi.clearSelection();
      document.getElementById('mainImageStatus').textContent = '';
      document.getElementById('galleryStatus').textContent = '';
    }

    document.getElementById('productModal').hidden = false;
  }

  function closeModal() {
    document.getElementById('productModal').hidden = true;
    editingId = null;
  }

  async function saveProduct(e) {
    e.preventDefault();
    const extraRaw = document.getElementById('fExtraCollections').value;
    const extra = extraRaw.split(',').map((s) => s.trim()).filter(Boolean);
    const mainCol = document.getElementById('fCollection').value;

    const row = {
      id: document.getElementById('fId').value.trim(),
      collection_slug: mainCol,
      name: document.getElementById('fName').value.trim(),
      price: Number(document.getElementById('fPrice').value),
      unit: document.getElementById('fUnit').value,
      coupon: parseNum(document.getElementById('fCoupon').value),
      width: parseNum(document.getElementById('fWidth').value),
      extra_collections: extra.filter((s) => s !== mainCol),
      image: document.getElementById('fImage').value.trim() || null,
      images: document.getElementById('fImages').value.split('\n').map((s) => s.trim()).filter(Boolean),
      colors: document.getElementById('fColors').value.split(',').map((s) => s.trim()).filter(Boolean),
      description: document.getElementById('fDescription').value.trim(),
      details: document.getElementById('fDetails').value.trim() || null,
      features: document.getElementById('fFeatures').value.split('\n').map((s) => s.trim()).filter(Boolean),
      brand: document.getElementById('fBrand').value.trim() || null,
      available: document.getElementById('fAvailable').value === 'true',
    };

    if (!row.images.length && row.image) row.images = [row.image];

    const { error } = editingId
      ? await client.from('products').update(row).eq('id', editingId)
      : await client.from('products').insert(row);

    if (error) { toast(error.message, 'error'); return; }

    await loadData();
    renderTable();
    closeModal();
    toast(editingId ? 'Produit mis à jour' : 'Produit ajouté', 'success');
  }

  function parseNum(v) {
    if (v === '' || v == null) return null;
    return Number(v);
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function toast(msg, type) {
    const el = document.getElementById('toast');
    el.hidden = false;
    el.className = 'alert alert--' + type;
    el.textContent = msg;
    el.style.marginBottom = '1rem';
    setTimeout(() => { el.hidden = true; }, 3000);
  }
})();
