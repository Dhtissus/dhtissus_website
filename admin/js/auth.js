/**
 * DH TISSU Admin — Supabase & authentification
 */
window.DH_ADMIN = (function () {
  let supabase = null;

  async function init() {
    if (supabase) return supabase;

    if (!window.DH_SUPABASE) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = '/api/config.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    const cfg = window.DH_SUPABASE;
    if (!cfg?.configured) {
      throw new Error('Supabase non configuré. Créez le fichier .env avec vos clés.');
    }

    const { createClient } = window.supabase;
    supabase = createClient(cfg.url, cfg.anonKey);
    return supabase;
  }

  async function requireAuth() {
    const client = await init();
    const { data: { session } } = await client.auth.getSession();
    if (!session) {
      window.location.href = '/admin/login.html';
      return null;
    }
    return session;
  }

  async function login(email, password) {
    const client = await init();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function logout() {
    const client = await init();
    await client.auth.signOut();
    window.location.href = '/admin/login.html';
  }

  function formatPrice(n) {
    return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(n);
  }

  function renderSidebar(active) {
    const user = document.getElementById('adminUser');
    if (user) {
      init().then(async (client) => {
        const { data: { session } } = await client.auth.getSession();
        user.textContent = session?.user?.email || '';
      });
    }

    document.querySelectorAll('.admin-nav a').forEach((a) => {
      a.classList.toggle('active', a.dataset.page === active);
    });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    }
  }

  return { init, requireAuth, login, logout, formatPrice, renderSidebar, getClient: () => supabase };
})();
