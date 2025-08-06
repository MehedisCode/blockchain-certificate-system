import React, { useState } from 'react';
import { ethers } from 'ethers';

function Login({ setUserAddress }) {
  const [error, setError] = useState('');

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask not detected');
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setUserAddress(address);
    } catch (err) {
      setError('User denied wallet connection');
    }
  };

  return (
    <div>
      <button onClick={connectWallet}>Login with MetaMask</button>
      {error && <p>{error}</p>}
    </div>
  );
}

export default Login;
