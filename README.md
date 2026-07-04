# The-Whole-Hole
This is where stuff goes to get lost

## Vaults

A vault is a password-protected container for secrets (title/value pairs).
Vault contents are encrypted at rest with AES-256-GCM using a key derived
from the vault's password via scrypt; the password itself is never stored.

### Run it

```
npm install
npm start
```

Then open http://localhost:3000.

### Make a vault

Click **+ New Vault**, give it a name and a password.

### Open a vault

Click a vault in the list and enter its password. Wrong passwords are
rejected; a correct password decrypts and shows the vault's secrets, where
you can add new ones. Click **Lock** to close it.
