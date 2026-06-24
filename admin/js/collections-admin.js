(async function () {
  const session = await DH_ADMIN.requireAuth();
  if (!session) return;

  mountAdminPage('collections', 'Collections', `
    <div id="toast" hidden></div>
    <div class="admin-panel">
      <div class="admin-panel__header">
        <h2>Catégories du catalogue</h2>
        <button class="btn btn--primary btn--sm" id="addBtn" style="width:auto">+ Collection</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Slug</th><th>Nom</th><th>Description</th><th>Actions</th></tr></thead>
          <tbody id="colTable"><tr><td colspan="4">Chargement…</td></tr></tbody>
        </table>
      </div>
    </div>
    <div class="modal-overlay" id="modal" hidden>
      <div class="modal">
        <div class="modal__header"><h2 id="modalTitle">Collection</h2><button class="modal-close" id="closeModal">&times;</button></div>
        <form id="colForm">
          <div class="modal__body">
            <div class="form-group"><label>Slug (id) *</label><input id="fSlug" required pattern="[a-z0-9-]+"></div>
            <div class="form-group"><label>Nom *</label><input id="fName" required></div>
            <div class="form-group"><label>Description</label><textarea id="fDesc" rows="3"></textarea></div>
            <div class="form-group image-upload-group">
              <label>Image de la collection</label>
              <div class="image-upload-box">
                <img id="colImagePreview" class="image-preview" hidden alt="Aperçu">
                <div class="image-upload-actions">
                  <input type="file" id="fImageFile" accept="image/png,image/jpeg,image/webp" hidden>
                  <button type="button" class="btn btn--outline btn--sm" id="pickColImage">📁 Choisir une photo</button>
                  <span id="colImageStatus" class="upload-status"></span>
                </div>
              </div>
              <input type="hidden" id="fImage">
            </div>
          </div>
          <div class="modal__footer">
            <button type="button" class="btn btn--outline" id="cancelBtn">Annuler</button>
            <button type="submit" class="btn btn--primary" style="width:auto">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  `);

  const client = DH_ADMIN.getClient();
  let collections = [];
  let editing = null;

  const colImageUi = DH_UPLOAD.bindMainImagePicker({
    pickBtnId: 'pickColImage',
    fileInputId: 'fImageFile',
    hiddenInputId: 'fImage',
    previewId: 'colImagePreview',
    statusId: 'colImageStatus',
  });

  await load();
  bind();

  async function load() {
    const { data } = await client.from('collections').select('*').order('sort_order');
    collections = data || [];
    render();
  }

  function render() {
    const tbody = document.getElementById('colTable');
    tbody.innerHTML = collections.map((c) => `
      <tr>
        <td><code>${c.slug}</code></td>
        <td>${esc(c.name)}</td>
        <td>${esc((c.description || '').slice(0, 80))}${(c.description || '').length > 80 ? '…' : ''}</td>
        <td><button class="btn btn--outline btn--sm edit" data-slug="${c.slug}">Modifier</button></td>
      </tr>`).join('');

    tbody.querySelectorAll('.edit').forEach((btn) => {
      btn.addEventListener('click', () => {
        const c = collections.find((x) => x.slug === btn.dataset.slug);
        editing = c.slug;
        document.getElementById('modalTitle').textContent = 'Modifier collection';
        document.getElementById('fSlug').value = c.slug;
        document.getElementById('fSlug').disabled = true;
        document.getElementById('fName').value = c.name;
        document.getElementById('fDesc').value = c.description || '';
        document.getElementById('fImage').value = c.image || '';
        colImageUi.showPreview(c.image || '');
        document.getElementById('modal').hidden = false;
      });
    });
  }

  function bind() {
    document.getElementById('addBtn').addEventListener('click', () => {
      editing = null;
      document.getElementById('colForm').reset();
      document.getElementById('fSlug').disabled = false;
      document.getElementById('modalTitle').textContent = 'Nouvelle collection';
      colImageUi.showPreview('');
      document.getElementById('colImageStatus').textContent = '';
      document.getElementById('modal').hidden = false;
    });
    document.getElementById('closeModal').addEventListener('click', () => { document.getElementById('modal').hidden = true; });
    document.getElementById('cancelBtn').addEventListener('click', () => { document.getElementById('modal').hidden = true; });
    document.getElementById('colForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const slug = document.getElementById('fSlug').value.trim();
      const row = {
        name: document.getElementById('fName').value.trim(),
        description: document.getElementById('fDesc').value.trim() || null,
        image: document.getElementById('fImage').value.trim() || null,
      };
      const { error } = editing
        ? await client.from('collections').update(row).eq('slug', editing)
        : await client.from('collections').insert({ ...row, slug, sort_order: collections.length });
      if (error) { toast(error.message, 'error'); return; }
      document.getElementById('modal').hidden = true;
      await load();
      toast('Collection enregistrée', 'success');
    });
  }

  function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function toast(msg, type) {
    const el = document.getElementById('toast');
    el.hidden = false; el.className = 'alert alert--' + type; el.textContent = msg;
    el.style.marginBottom = '1rem';
  }
})();
