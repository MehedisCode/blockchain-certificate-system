import React, { useState } from 'react';
import { ethers } from 'ethers';
import metamaskLogo from '/images/metamask-logo.svg';

function Login({ setUserAddress }) {
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chainId
      });
      return true;
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0xaa36a7',
                chainName: 'Sepolia Test Network',
                rpcUrls: ['https://rpc.sepolia.org'],
                nativeCurrency: {
                  name: 'Sepolia ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error('Error adding Sepolia network:', addError);
          setError(
            'Failed to add Sepolia network to MetaMask. Please add it manually.'
          );
          return false;
        }
      } else {
        console.error('Error switching to Sepolia:', switchError);
        setError(
          'Failed to switch to Sepolia network. Please switch manually.'
        );
        return false;
      }
    }
  };

  const checkCurrentNetwork = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      return network.chainId === 11155111n; // Sepolia chain ID
    } catch (error) {
      console.error('Error checking network:', error);
      return false;
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask not detected. Please install MetaMask.');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      // Disconnect the previously stored address (force disconnect)
      localStorage.removeItem('userAddress');
      // Reset the Ethereum provider
      window.ethereum.request({ method: 'eth_requestAccounts' }); // This will trigger the login if MetaMask is locked

      // First, check if we're on Sepolia
      const isOnSepolia = await checkCurrentNetwork();

      // If not on Sepolia, switch automatically
      if (!isOnSepolia) {
        const switched = await switchToSepolia();
        if (!switched) {
          setIsConnecting(false);
          return; // Stop if network switch failed
        }
      }

      // Now connect to wallet
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []); // Prompt for wallet login
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Double-check we're on Sepolia after connection
      const finalNetworkCheck = await checkCurrentNetwork();
      if (!finalNetworkCheck) {
        setError(
          'Please ensure you are connected to Sepolia network in MetaMask.'
        );
        setIsConnecting(false);
        return;
      }

      setUserAddress(address);
      localStorage.setItem('userAddress', address);
    } catch (err) {
      console.error('Connection error:', err);
      if (err.code === 4001) {
        setError(
          'Connection rejected. Please approve the connection in MetaMask.'
        );
      } else if (err.code === -32002) {
        setError(
          'MetaMask is already processing a request. Please check your MetaMask.'
        );
      } else {
        setError(
          'User denied wallet connection or an error occurred. Error: ' +
            err.message
        );
      }
    } finally {
      setIsConnecting(false);
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
            disabled={isConnecting}
            className="flex items-center gap-3 rounded-lg bg-orange-500 px-6 py-3 text-lg font-semibold text-white shadow-lg transition duration-300 hover:bg-orange-600 disabled:opacity-50"
          >
            <img src={metamaskLogo} alt="MetaMask" className="h-7 w-7" />
            {isConnecting ? 'Connecting...' : 'Connect with MetaMask'}
          </button>

          {error && (
            <div className="mt-4 w-full max-w-md rounded border border-red-400 bg-red-100 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <p className="mt-6 max-w-sm text-xs text-gray-500">
            The app will automatically switch to Sepolia test network when
            connecting.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
