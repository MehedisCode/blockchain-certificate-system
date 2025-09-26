import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Login from './pages/Login';
import Routing from './Components/Routing';
import institutionContractABI from './contracts/Institution.json';

function App() {
  const [userAddress, setUserAddress] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [institutionContract, setInstitutionContract] = useState(null);

  const institutionContractAddress = import.meta.env
    .VITE_INSTITUTION_CONTRACT_ADDRESS;

  useEffect(() => {
    const savedAddress = localStorage.getItem('userAddress');
    if (savedAddress) {
      setUserAddress(savedAddress);
      detectUserRole(); // Check role when address is found
    } else {
      setLoading(false); // If no address, just stop loading
    }
  }, []);

  const detectUserRole = async () => {
    try {
      // Ensure the Ethereum wallet (MetaMask) is connected
      if (!window.ethereum) {
        alert('MetaMask is not installed or Ethereum is not available!');
        setLoading(false);
        return;
      }

      // Connect to Ethereum network and get role (e.g., admin, institute, student)
      const provider = new ethers.BrowserProvider(window.ethereum); // For Ethers.js v6
      await provider.send('eth_requestAccounts', []); // Request account access if not connected
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Create the contract instance
      const contract = new ethers.Contract(
        institutionContractAddress,
        institutionContractABI.abi,
        signer
      );
      setInstitutionContract(contract);

      // Logic to fetch role from contract (e.g., Admin, Institute, Student)
      const adminAddress = import.meta.env.VITE_ADMIN_WALLET_ADDRESS;
      const isAdmin = userAddress === adminAddress;
      const isInstitute = await contract.checkInstitutePermission(userAddress);
      console.log('Institute check:', isInstitute);

      // Set user role based on contract and wallet address
      if (isAdmin) {
        setUserRole('admin');
      } else if (isInstitute) {
        setUserRole('institute');
      } else {
        setUserRole('student');
      }
    } catch (error) {
      console.error(error);
      setUserRole('student'); // Default to student if error occurs
    }
    setLoading(false); // Set loading to false after checking role
  };

  return (
    <div>
      {loading ? (
        <div>Loading...</div>
      ) : !userAddress ? (
        <Login
          setUserAddress={address => {
            setUserAddress(address);
            localStorage.setItem('userAddress', address); // Save the user address in localStorage
            detectUserRole(); // Check role when address is set
          }}
        />
      ) : (
        <Routing
          institutionContract={institutionContract}
          userAddress={userAddress}
          userRole={userRole}
        />
      )}
    </div>
  );
}

export default App;
