const crypto = require('node:crypto');

const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

function deriveKey(password, salt) {
  return crypto.scryptSync(password, salt, KEY_LENGTH);
}

function generateSalt() {
  return crypto.randomBytes(SALT_LENGTH);
}

function encrypt(plaintextObj, key) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(plaintextObj), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { iv, ciphertext, authTag };
}

// Throws if the key is wrong (GCM auth tag verification fails).
function decrypt({ iv, ciphertext, authTag }, key) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(plaintext.toString('utf8'));
}

module.exports = { deriveKey, generateSalt, encrypt, decrypt };
