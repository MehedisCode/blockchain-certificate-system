import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Login from './pages/Login';
import Routing from './routes/Routing';
import institutionContractABI from './contracts/Institution.json';

function App() {
  const [userAddress, setUserAddress] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [institutionContract, setInstitutionContract] = useState(null);
  const [contractError, setContractError] = useState('');

  const institutionContractAddress = import.meta.env
    .VITE_INSTITUTION_CONTRACT_ADDRESS;

  useEffect(() => {
    const initializeApp = async () => {
      const savedAddress = localStorage.getItem('userAddress');
      if (savedAddress) {
        setUserAddress(savedAddress);
        await detectUserRole(savedAddress);
      } else {
        setLoading(false);
      }
    };

    initializeApp();

    // Listen for network changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', chainId => {
        console.log('Network changed to:', chainId);
        // If user is connected and network changes, update the role
        if (userAddress) {
          detectUserRole(userAddress);
        }
      });

      // Listen for account changes
      window.ethereum.on('accountsChanged', accounts => {
        console.log('Accounts changed:', accounts);
        if (accounts.length === 0) {
          // User disconnected all accounts
          setUserAddress(null);
          setUserRole('');
          localStorage.removeItem('userAddress');
        } else {
          // User switched accounts
          setUserAddress(accounts[0]);
          localStorage.setItem('userAddress', accounts[0]);
          detectUserRole(accounts[0]);
        }
      });
    }
  }, [userAddress]);

  const detectUserRole = async (address = null) => {
    try {
      setContractError('');
      setLoading(true);

      if (!window.ethereum) {
        console.warn('MetaMask not available');
        setUserRole('student');
        setLoading(false);
        return;
      }

      let currentAddress = address;
      let provider = null;
      let signer = null;

      // Create provider and check network
      provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      // Check if we're on Sepolia
      if (network.chainId !== 11155111n) {
        console.warn('Not on Sepolia network:', network.name);
        setUserRole('student');
        setLoading(false);
        return;
      }

      // Get signer and current address
      signer = await provider.getSigner();
      currentAddress = await signer.getAddress();

      // Update address if different
      if (currentAddress !== userAddress) {
        setUserAddress(currentAddress);
        localStorage.setItem('userAddress', currentAddress);
      }

      // Validate contract address
      if (
        !institutionContractAddress ||
        !ethers.isAddress(institutionContractAddress)
      ) {
        console.error('Invalid contract address:', institutionContractAddress);
        setContractError('Invalid contract address configuration');
        setUserRole('student');
        setLoading(false);
        return;
      }

      // Check if contract is deployed
      const code = await provider.getCode(institutionContractAddress);
      if (code === '0x') {
        console.error(
          'No contract deployed at address:',
          institutionContractAddress
        );
        setContractError('No contract found at the configured address.');
        setUserRole('student');
        setLoading(false);
        return;
      }

      // Create contract instance
      const contract = new ethers.Contract(
        institutionContractAddress,
        institutionContractABI.abi,
        signer
      );

      setInstitutionContract(contract);

      // Get admin address from environment
      const adminAddress = import.meta.env.VITE_ADMIN_WALLET_ADDRESS;

      if (!adminAddress) {
        console.error('Admin address not found in environment variables');
        setUserRole('student');
        setLoading(false);
        return;
      }

      console.log('Detecting role for:', currentAddress);
      console.log('Admin address:', adminAddress);

      // Check if user is admin
      const isAdmin =
        currentAddress.toLowerCase() === adminAddress.toLowerCase();

      if (isAdmin) {
        console.log('User is admin');
        setUserRole('admin');
        setLoading(false);
        return;
      }

      // Check institute permission
      try {
        console.log('Checking institute permission...');
        const isInstitute =
          await contract.checkInstitutePermission(currentAddress);
        console.log('Institute permission result:', isInstitute);

        if (isInstitute) {
          setUserRole('institute');
        } else {
          setUserRole('student');
        }
      } catch (callError) {
        console.error('Error checking institute permission:', callError);
        // If institute check fails, default to student
        setUserRole('student');

        // Only show error if it's not a contract-related issue
        if (
          callError.message.includes('network') ||
          callError.message.includes('RPC')
        ) {
          setContractError('Network connection issue. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error detecting user role:', error);
      setUserRole('student');

      // Show user-friendly error messages
      if (error.message.includes('user rejected') || error.code === 4001) {
        setContractError('Connection was rejected. Please try again.');
      } else if (
        error.message.includes('network') ||
        error.message.includes('RPC')
      ) {
        setContractError(
          'Network connection issue. Please check your connection.'
        );
      } else {
        setContractError('An error occurred while detecting your role.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = address => {
    setUserAddress(address);
    localStorage.setItem('userAddress', address);
    detectUserRole(address);
  };

  const handleLogout = () => {
    setUserAddress(null);
    setUserRole('');
    setInstitutionContract(null);
    setContractError('');
    localStorage.removeItem('userAddress');
  };

  const retryConnection = () => {
    if (userAddress) {
      detectUserRole(userAddress);
    }
  };

  return (
    <div>
      {loading ? (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-lg">Loading...</div>
        </div>
      ) : !userAddress ? (
        <Login setUserAddress={handleLoginSuccess} />
      ) : (
        <div>
          {contractError && (
            <div className="relative m-4 rounded border border-yellow-400 bg-yellow-100 px-4 py-3 text-yellow-700">
              <strong className="font-bold">Warning: </strong>
              <span className="block sm:inline">{contractError}</span>
              <div className="mt-2">
                <button
                  onClick={retryConnection}
                  className="mr-2 rounded bg-green-500 px-2 py-1 text-sm font-bold text-white hover:bg-green-700"
                >
                  Retry
                </button>
                <button
                  onClick={handleLogout}
                  className="rounded bg-red-500 px-2 py-1 text-sm font-bold text-white hover:bg-red-700"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
          <Routing
            institutionContract={institutionContract}
            userAddress={userAddress}
            userRole={userRole}
            setUserAddress={setUserAddress}
            onLogout={handleLogout}
          />
        </div>
      )}
    </div>
  );
}

export default App;
