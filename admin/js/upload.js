/**
 * DH TISSU Admin — Upload d'images vers le serveur
 */
window.DH_UPLOAD = {
  async uploadImage(file) {
    const client = DH_ADMIN.getClient();
    const { data: { session } } = await client.auth.getSession();
    if (!session) throw new Error('Session expirée — reconnectez-vous');

    const form = new FormData();
    form.append('image', file);

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: form,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload échoué');
    return data.path;
  },

  bindMainImagePicker({ pickBtnId, fileInputId, hiddenInputId, previewId, statusId }) {
    const pickBtn = document.getElementById(pickBtnId);
    const fileInput = document.getElementById(fileInputId);
    const hiddenInput = document.getElementById(hiddenInputId);
    const preview = document.getElementById(previewId);
    const status = statusId ? document.getElementById(statusId) : null;

    pickBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;

      if (status) {
        status.textContent = 'Envoi en cours…';
        status.className = 'upload-status upload-status--loading';
      }
      pickBtn.disabled = true;

      try {
        const imagePath = await this.uploadImage(file);
        hiddenInput.value = imagePath;
        preview.src = `/${imagePath}?t=${Date.now()}`;
        preview.hidden = false;
        if (status) {
          status.textContent = 'Photo enregistrée';
          status.className = 'upload-status upload-status--ok';
        }
      } catch (err) {
        if (status) {
          status.textContent = err.message;
          status.className = 'upload-status upload-status--error';
        }
      } finally {
        pickBtn.disabled = false;
        fileInput.value = '';
      }
    });

    return {
      showPreview(path) {
        if (!path) {
          preview.hidden = true;
          preview.removeAttribute('src');
          return;
        }
        preview.src = `/${path}`;
        preview.hidden = false;
      },
      clearImage() {
        hiddenInput.value = '';
        preview.hidden = true;
        preview.removeAttribute('src');
        if (status) status.textContent = '';
      },
    };
  },

  bindGalleryPicker({ pickBtnId, fileInputId, textareaId, previewId, statusId, deleteBtnId }) {
    const pickBtn = document.getElementById(pickBtnId);
    const fileInput = document.getElementById(fileInputId);
    const textarea = document.getElementById(textareaId);
    const preview = document.getElementById(previewId);
    const status = statusId ? document.getElementById(statusId) : null;
    const deleteBtn = deleteBtnId ? document.getElementById(deleteBtnId) : null;
    let selectedIndex = -1;

    const getPaths = () => textarea.value.split('\n').map((s) => s.trim()).filter(Boolean);

    const setPaths = (paths) => {
      textarea.value = paths.join('\n');
      renderPreview();
    };

    const renderPreview = () => {
      const paths = getPaths();
      if (selectedIndex >= paths.length) selectedIndex = -1;

      if (!paths.length) {
        preview.innerHTML = '<p class="gallery-empty">Aucune photo dans la galerie</p>';
        if (deleteBtn) deleteBtn.disabled = true;
        return;
      }

      preview.innerHTML = paths.map((p, i) => `
        <div class="gallery-thumb${i === selectedIndex ? ' gallery-thumb--selected' : ''}" data-index="${i}" title="Cliquer pour sélectionner">
          <img src="/${p}" alt="">
          <button type="button" class="gallery-thumb__delete" data-index="${i}" aria-label="Supprimer cette photo">&times;</button>
        </div>
      `).join('');

      preview.querySelectorAll('.gallery-thumb').forEach((thumb) => {
        thumb.addEventListener('click', (e) => {
          if (e.target.closest('.gallery-thumb__delete')) return;
          selectedIndex = Number(thumb.dataset.index);
          renderPreview();
          if (deleteBtn) deleteBtn.disabled = false;
        });
      });

      preview.querySelectorAll('.gallery-thumb__delete').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          removeAt(Number(btn.dataset.index));
        });
      });

      if (deleteBtn) deleteBtn.disabled = selectedIndex < 0;
    };

    const removeAt = (index) => {
      const paths = getPaths();
      if (index < 0 || index >= paths.length) return;
      paths.splice(index, 1);
      if (selectedIndex === index) selectedIndex = -1;
      else if (selectedIndex > index) selectedIndex -= 1;
      setPaths(paths);
      if (status) {
        status.textContent = 'Photo supprimée de la galerie';
        status.className = 'upload-status upload-status--ok';
      }
    };

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (selectedIndex < 0) return;
        removeAt(selectedIndex);
      });
    }

    pickBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async () => {
      const files = [...fileInput.files];
      if (!files.length) return;

      if (status) {
        status.textContent = `Envoi de ${files.length} photo(s)…`;
        status.className = 'upload-status upload-status--loading';
      }
      pickBtn.disabled = true;

      try {
        const existing = textarea.value.split('\n').map((s) => s.trim()).filter(Boolean);
        for (const file of files) {
          const imagePath = await this.uploadImage(file);
          existing.push(imagePath);
        }
        textarea.value = existing.join('\n');
        renderPreview();
        if (status) {
          status.textContent = `${files.length} photo(s) ajoutée(s)`;
          status.className = 'upload-status upload-status--ok';
        }
      } catch (err) {
        if (status) {
          status.textContent = err.message;
          status.className = 'upload-status upload-status--error';
        }
      } finally {
        pickBtn.disabled = false;
        fileInput.value = '';
      }
    });

    return { renderPreview, clearSelection: () => { selectedIndex = -1; renderPreview(); } };
  },
};
