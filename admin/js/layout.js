/**
 * DH TISSU Admin — layout partagé
 */
function adminLayout(activePage) {
  return `
  <aside class="admin-sidebar">
    <div class="admin-sidebar__top">
      <div class="admin-logo">
        <img src="../assets/logo-dhtissu.png" alt="La Maison du Tissu — Haute Couture" class="admin-logo__img">
        <small>Administration</small>
      </div>
      <nav class="admin-nav">
        <a href="index.html" data-page="dashboard">Tableau de bord</a>
        <a href="produits.html" data-page="produits">Produits</a>
        <a href="collections.html" data-page="collections">Collections</a>
        <a href="formulaire.html" data-page="formulaire">Formulaire</a>
        <a href="parametres.html" data-page="parametres">Paramètres</a>
      </nav>
    </div>
    <div class="admin-sidebar__footer">
      <a href="#" id="logoutBtn" class="admin-logout">Déconnexion</a>
    </div>
  </aside>`;
}

function mountAdminPage(activePage, title, contentHtml) {
  document.body.innerHTML = `
    <div class="admin-layout">
      ${adminLayout(activePage)}
      <main class="admin-main">
        <div class="admin-header">
          <h1>${title}</h1>
          <span class="admin-user" id="adminUser"></span>
        </div>
        ${contentHtml}
      </main>
    </div>`;
  DH_ADMIN.renderSidebar(activePage);
}
