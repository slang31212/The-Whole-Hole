const express = require('express');
const path = require('node:path');
const db = require('./lib/db');
const { deriveKey, generateSalt, encrypt, decrypt } = require('./lib/crypto');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const insertVault = db.prepare(`
  INSERT INTO vaults (name, salt, iv, auth_tag, ciphertext)
  VALUES (?, ?, ?, ?, ?)
`);
const listVaultsStmt = db.prepare('SELECT id, name, created_at FROM vaults ORDER BY created_at DESC');
const getVaultStmt = db.prepare('SELECT * FROM vaults WHERE id = ?');
const updateVaultStmt = db.prepare(`
  UPDATE vaults SET iv = ?, auth_tag = ?, ciphertext = ? WHERE id = ?
`);

function unlockVault(id, password) {
  const vault = getVaultStmt.get(id);
  if (!vault) {
    return { error: 'not_found' };
  }
  const key = deriveKey(password, vault.salt);
  try {
    const data = decrypt({ iv: vault.iv, ciphertext: vault.ciphertext, authTag: vault.auth_tag }, key);
    return { vault, key, data };
  } catch {
    return { error: 'wrong_password' };
  }
}

app.get('/api/vaults', (req, res) => {
  const vaults = listVaultsStmt.all().map((v) => ({ id: v.id, name: v.name, createdAt: v.created_at }));
  res.json(vaults);
});

app.post('/api/vaults', (req, res) => {
  const { name, password } = req.body || {};
  if (!name || !password) {
    return res.status(400).json({ error: 'name and password are required' });
  }
  const salt = generateSalt();
  const key = deriveKey(password, salt);
  const { iv, ciphertext, authTag } = encrypt({ items: [] }, key);
  const result = insertVault.run(name, salt, iv, authTag, ciphertext);
  res.status(201).json({ id: Number(result.lastInsertRowid), name });
});

app.post('/api/vaults/:id/unlock', (req, res) => {
  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ error: 'password is required' });
  }
  const result = unlockVault(Number(req.params.id), password);
  if (result.error === 'not_found') {
    return res.status(404).json({ error: 'vault not found' });
  }
  if (result.error === 'wrong_password') {
    return res.status(401).json({ error: 'incorrect password' });
  }
  res.json({ id: result.vault.id, name: result.vault.name, items: result.data.items });
});

app.post('/api/vaults/:id/items', (req, res) => {
  const { password, title, secret } = req.body || {};
  if (!password || !title || !secret) {
    return res.status(400).json({ error: 'password, title and secret are required' });
  }
  const result = unlockVault(Number(req.params.id), password);
  if (result.error === 'not_found') {
    return res.status(404).json({ error: 'vault not found' });
  }
  if (result.error === 'wrong_password') {
    return res.status(401).json({ error: 'incorrect password' });
  }
  const items = [...result.data.items, { title, secret, addedAt: new Date().toISOString() }];
  const { iv, ciphertext, authTag } = encrypt({ items }, result.key);
  updateVaultStmt.run(iv, authTag, ciphertext, result.vault.id);
  res.status(201).json({ items });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`The Whole Hole listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
