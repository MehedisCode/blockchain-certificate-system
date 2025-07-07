import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import InstitutionAbi from './contracts/Institution.json';

const institutionAddress = import.meta.env.VITE_INSTITUTION_ADDRESS;

function App() {
  const [account, setAccount] = useState('');
  const [institute, setInstitute] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      const [selectedAccount] = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      setAccount(selectedAccount);
    }
  };

  const addInstitute = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const institution = new ethers.Contract(
        institutionAddress,
        InstitutionAbi.abi,
        signer
      );

      // institute data
      const name = 'My Blockchain Institute';
      const acronym = 'MBI';
      const link = 'https://mbi.edu';
      const courses = [['Blockchain Basics']];

      // Call the addInstitute function from contract
      const tx = await institution.addInstitute(
        userAddress,
        name,
        acronym,
        link,
        courses
      );

      await tx.wait(); // wait for transaction to be mined

      alert('Institute added successfully!');
    } catch (error) {
      console.error('Error adding institute:', error);
      alert('Failed to add institute. Are you the contract owner?');
    }
  };

  const getInstituteData = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const institution = new ethers.Contract(
      institutionAddress,
      InstitutionAbi.abi,
      signer
    );

    const userAddress = await signer.getAddress();

    try {
      const permission =
        await institution.checkInstitutePermission(userAddress);
      if (!permission) {
        alert('You are not registered as an institute.');
        return;
      }

      const data = await institution.getInstituteData();
      setInstitute(data);
    } catch (err) {
      console.error('Error:', err);
      alert('Something went wrong while fetching data.');
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-100">
      <div className="w-full max-w-xl rounded bg-white p-8 text-center shadow">
        <h2 className="mb-6 text-2xl font-bold text-red-600">
          Blockchain Certificate Frontend
        </h2>

        {account ? (
          <p className="mb-4">Connected as: {account}</p>
        ) : (
          <button
            onClick={connectWallet}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Connect Wallet
          </button>
        )}

        <div className="mt-4 space-y-4">
          <button
            onClick={addInstitute}
            className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          >
            Add My Institute
          </button>
          <br />
          <button
            onClick={getInstituteData}
            className="rounded bg-indigo-500 px-4 py-2 text-white hover:bg-indigo-600"
          >
            Get Institute Data
          </button>
        </div>

        {institute && (
          <div className="mt-6 text-left">
            <p>
              <strong>Name:</strong> {institute[0]}
            </p>
            <p>
              <strong>Acronym:</strong> {institute[1]}
            </p>
            <p>
              <strong>Website:</strong> {institute[2]}
            </p>
            <h4 className="mt-4 font-semibold">Courses:</h4>
            <ul className="ml-6 list-disc">
              {institute[3].map((course, idx) => (
                <li key={idx}>{course.course_name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
