import CryptoJS from 'crypto-js';

export function decrypt(encryptedData, certId) {
  const salt = import.meta.env.VITE_SALT;
  const bytes = CryptoJS.AES.decrypt(encryptedData, certId + salt);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(decrypted);
}
