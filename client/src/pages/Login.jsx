import React, { useState } from 'react';
import { ethers } from 'ethers';
import metamaskLogo from '/images/metamask-logo.svg';
// import backgroundImage from '/images/certificate-background.jpg';

function Login({ setUserAddress }) {
  const [error, setError] = useState('');

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask not detected. Please install MetaMask.');
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setUserAddress(address);
      localStorage.setItem('userAddress', address);
    } catch (err) {
      setError(
        'User denied wallet connection or an error occurred. Error : ' +
          err.message
      );
    }
  };

  return (
    <div className="font-poppins flex min-h-screen items-center justify-center bg-purple-100">
      <div className="grid h-[640px] w-full max-w-6xl grid-cols-1 overflow-hidden rounded-lg bg-white shadow-2xl md:grid-cols-2">
        {/* Left Side - Image with overlay */}
        <div className="relative h-80 md:h-auto">
          <div className="bg-opacity-50 absolute inset-0 flex items-center justify-center bg-purple-800 p-6 text-center text-white">
            <div>
              <h2 className="mb-2 text-2xl font-semibold md:text-3xl">
                Empower Your Credentials
              </h2>
              <p className="text-sm md:text-base">
                Blockchain-based academic certificate verification made simple.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Content */}
        <div className="flex flex-col items-center justify-center p-8 text-center md:p-12">
          <h1 className="font-montserrat mb-4 text-3xl font-bold text-purple-800 md:text-4xl">
            Welcome to <br /> Blockchain Certificate System
          </h1>
          <p className="mb-6 max-w-md leading-relaxed text-gray-700">
            Securely manage and verify academic certificates using blockchain
            technology. Connect your MetaMask wallet to get started.
          </p>

          <button
            onClick={connectWallet}
            className="flex items-center gap-3 rounded-lg bg-orange-500 px-6 py-3 text-lg font-semibold text-white shadow-lg transition duration-300 hover:bg-orange-600"
          >
            <img src={metamaskLogo} alt="MetaMask" className="h-7 w-7" />
            Connect with MetaMask
          </button>

          {error && (
            <div className="mt-4 w-full max-w-md rounded border border-red-400 bg-red-100 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <p className="mt-6 max-w-sm text-xs text-gray-500">
            Ensure MetaMask is installed and connected to the correct Ethereum
            network.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
