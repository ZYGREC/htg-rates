const config = require('../config');

let cache = {
  data: null,
  fetchedAt: null,
  expiresAt: null,
};

function getCacheInfo() {
  if (!cache.data || !cache.fetchedAt) {
    return { hit: false, age_ms: null, expires_in_ms: null };
  }

  const ageMs = Date.now() - cache.fetchedAt.getTime();
  const expiresInMs = cache.expiresAt ? Math.max(0, cache.expiresAt.getTime() - Date.now()) : null;

  return {
    hit: isValid(),
    age_ms: ageMs,
    expires_in_ms: expiresInMs,
    fetched_at: cache.fetchedAt.toISOString(),
  };
}

function isValid() {
  if (!cache.data || !cache.expiresAt) {
    return false;
  }
  return Date.now() < cache.expiresAt.getTime();
}

function get() {
  if (!isValid()) {
    return null;
  }
  return cache.data;
}

function getStale() {
  return cache.data;
}

function set(data, ttlMs = config.cacheTtlMs) {
  const now = new Date();
  cache = {
    data,
    fetchedAt: now,
    expiresAt: new Date(now.getTime() + ttlMs),
  };
  return cache.data;
}

function clear() {
  cache = {
    data: null,
    fetchedAt: null,
    expiresAt: null,
  };
}

function getLastFetch() {
  return cache.fetchedAt ? cache.fetchedAt.toISOString() : null;
}

module.exports = {
  get,
  getStale,
  set,
  clear,
  isValid,
  getCacheInfo,
  getLastFetch,
};
