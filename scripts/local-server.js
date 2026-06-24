const app = require('../lib/app');

const PREFERRED_PORTS = [Number(process.env.PORT) || 8080, 8081, 8082, 8888, 3000];

function tryListen(ports, index) {
  const port = ports[index];
  if (port === undefined) {
    console.error('  Aucun port disponible.');
    process.exit(1);
  }

  const server = app.listen(port, '127.0.0.1', () => {
    const { getConfig } = require('../lib/supabase');
    const { configured } = getConfig();
    console.log('');
    console.log('  DH TISSU — Serveur démarré');
    console.log('  Site public  : http://localhost:' + port);
    console.log('  Admin        : http://localhost:' + port + '/admin');
    console.log('  Supabase     : ' + (configured ? 'connecté' : 'non configuré (fallback products.js)'));
    console.log('  Ctrl+C pour arrêter');
    console.log('');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log('  Port ' + port + ' occupé, essai sur ' + ports[index + 1] + '...');
      tryListen(ports, index + 1);
      return;
    }
    console.error('  Erreur serveur :', err.message);
    process.exit(1);
  });
}

tryListen(PREFERRED_PORTS, 0);
