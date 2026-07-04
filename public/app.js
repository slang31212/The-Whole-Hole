const vaultListView = document.getElementById('vault-list-view');
const vaultView = document.getElementById('vault-view');
const vaultListEl = document.getElementById('vault-list');
const vaultNameEl = document.getElementById('vault-name');
const itemListEl = document.getElementById('item-list');

const modalBackdrop = document.getElementById('modal-backdrop');
const modalTitle = document.getElementById('modal-title');
const modalForm = document.getElementById('modal-form');
const modalNameInput = document.getElementById('modal-name-input');
const modalPasswordInput = document.getElementById('modal-password-input');
const modalError = document.getElementById('modal-error');

let modalMode = null; // 'create' | 'open'
let modalVaultId = null;

let currentVault = null; // { id, name, password }

async function refreshVaultList() {
  const res = await fetch('/api/vaults');
  const vaults = await res.json();
  vaultListEl.innerHTML = '';
  for (const vault of vaults) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = 'vault-item';
    btn.textContent = vault.name;
    btn.addEventListener('click', () => openModal('open', vault.id, vault.name));
    li.appendChild(btn);
    vaultListEl.appendChild(li);
  }
}

function openModal(mode, vaultId = null, name = '') {
  modalMode = mode;
  modalVaultId = vaultId;
  modalError.hidden = true;
  modalForm.reset();
  if (mode === 'create') {
    modalTitle.textContent = 'New Vault';
    modalNameInput.hidden = false;
    modalNameInput.required = true;
  } else {
    modalTitle.textContent = `Unlock "${name}"`;
    modalNameInput.hidden = true;
    modalNameInput.required = false;
  }
  modalBackdrop.hidden = false;
  modalPasswordInput.focus();
}

function closeModal() {
  modalBackdrop.hidden = true;
}

document.getElementById('new-vault-btn').addEventListener('click', () => openModal('create'));
document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);

modalForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = modalPasswordInput.value;
  modalError.hidden = true;

  if (modalMode === 'create') {
    const name = modalNameInput.value.trim();
    const res = await fetch('/api/vaults', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      modalError.textContent = body.error || 'Failed to create vault';
      modalError.hidden = false;
      return;
    }
    closeModal();
    await refreshVaultList();
  } else {
    const res = await fetch(`/api/vaults/${modalVaultId}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      modalError.textContent = body.error || 'Failed to unlock vault';
      modalError.hidden = false;
      return;
    }
    const data = await res.json();
    currentVault = { id: data.id, name: data.name, password };
    closeModal();
    showVault(data.items);
  }
});

function showVault(items) {
  vaultListView.hidden = true;
  vaultView.hidden = false;
  vaultNameEl.textContent = currentVault.name;
  renderItems(items);
}

function renderItems(items) {
  itemListEl.innerHTML = '';
  for (const item of items) {
    const li = document.createElement('li');
    li.className = 'secret-item';
    li.innerHTML = `<strong>${escapeHtml(item.title)}</strong>: ${escapeHtml(item.secret)}`;
    itemListEl.appendChild(li);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById('lock-vault-btn').addEventListener('click', () => {
  currentVault = null;
  vaultView.hidden = true;
  vaultListView.hidden = false;
  refreshVaultList();
});

document.getElementById('add-item-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('item-title').value.trim();
  const secret = document.getElementById('item-secret').value;
  const res = await fetch(`/api/vaults/${currentVault.id}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: currentVault.password, title, secret }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    alert(body.error || 'Failed to add item');
    return;
  }
  const data = await res.json();
  renderItems(data.items);
  e.target.reset();
});

refreshVaultList();
