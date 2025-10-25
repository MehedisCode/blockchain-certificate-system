import CryptoJS from 'crypto-js';

export function encrypt(inputData, certId) {
  const salt = import.meta.env.VITE_SALT;
  return CryptoJS.AES.encrypt(
    JSON.stringify(inputData),
    certId + salt
  ).toString();
}
