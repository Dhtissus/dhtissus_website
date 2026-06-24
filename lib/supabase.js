const { createClient } = require('@supabase/supabase-js');

function getConfig() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, anonKey, serviceKey, configured: Boolean(url && anonKey) };
}

function createAdminClient() {
  const { url, serviceKey, anonKey } = getConfig();
  if (!url) throw new Error('SUPABASE_URL manquant dans .env');
  const key = serviceKey || anonKey;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_ANON_KEY manquant');
  return createClient(url, key);
}

function createAnonClient() {
  const { url, anonKey } = getConfig();
  if (!url || !anonKey) throw new Error('Supabase non configuré');
  return createClient(url, anonKey);
}

module.exports = { getConfig, createAdminClient, createAnonClient };
