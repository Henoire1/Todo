const API_BASE = '';

export async function getEleves() {
  const res = await fetch(`${API_BASE}/eleve`);
  if (!res.ok) throw new Error('Erreur de chargement');
  return await res.json();
}

export async function addOrUpdateEleve(payload) {
  const existsRes = await fetch(`${API_BASE}/eleve`);
  const list = existsRes.ok ? await existsRes.json() : [];
  const exists = Array.isArray(list) && list.some(e => e.nom === payload.nom);
  const url = exists ? `${API_BASE}/eleve/${encodeURIComponent(payload.nom)}` : `${API_BASE}/eleve`;
  const method = exists ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || 'Erreur');
  }
  return await res.json();
}
export async function deleteEleve(nom) {
  const res = await fetch(`${API_BASE}/eleve/${encodeURIComponent(nom)}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || 'Erreur de suppression');
  }
  return await res.json();
}
