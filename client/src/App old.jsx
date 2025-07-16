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

      //       ins_name: 'National Institute of Modern Technology (NIMT)',
      // ins_add: '123 Knowledge Avenue, Dhaka 1212, Bangladesh',
      // name: 'Md. Arif Hossain',
      // id: '221-15-4896',
      // degree: 'Bachelor of Science (B.Sc)',
      // department: 'Computer Science and Engineering',
      // father: 'Mr. Abul Kalam Azad',
      // mother: 'Mrs. Rokeya Sultana',
      // session: '2021–2024',
      // cgpa: '3.85',
      // certId: 'CERT-BSC-2025-045-CS'

      // institute data
      const name = 'National Institute of Modern Technology';
      const address = '123 Knowledge Avenue, Dhaka 1212, Bangladesh';
      const acronym = 'NIMT';
      const link = 'https://nimt.edu';
      const degrees = [
        { degree_name: 'Bachelor of Science (B.Sc)' },
        { degree_name: 'Bachelor of Arts (B.A)' },
        { degree_name: 'Master of Science (M.Sc)' },
        { degree_name: 'Master of Arts (M.A)' },
      ];

      const departments = [
        { department_name: 'Computer Science and Engineering' },
        { department_name: 'Electrical and Electronic Engineering' },
        { department_name: 'Business Administration' },
        { department_name: 'Mechanical Engineering' },
        { department_name: 'Civil Engineering' },
      ];

      const tx = await institution.addInstitute(
        userAddress,
        name,
        address,
        acronym,
        link,
        degrees,
        departments
      );

      console.log('Submitted tx:', tx.hash);
      const receipt = await tx.wait();
      console.log('Mined in block:', receipt.blockNumber);

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
      console.log(data);
      setInstitute(data);
    } catch (err) {
      console.error('Error:', err);
      alert('Something went wrong while fetching data.');
    }
  };

  const updateInstituteName = async newName => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        institutionAddress,
        InstitutionAbi.abi,
        signer
      );
      console.log(newName);

      const tx = await contract.updateInstituteName(newName);
      await tx.wait();

      alert('Institute name updated!');
    } catch (err) {
      console.error('Error updating name:', err);
      alert('Update failed.');
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-100">
      <div className="w-full max-w-xl rounded bg-white p-8 text-center shadow">
        <h2 className="mb-6 text-2xl font-bold text-red-600">
          Blockchain Certificate Frontend
        </h2>

        {account ? (
          <p className="mb-4 text-black">Connected as: {account}</p>
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
          </button>{' '}
          <br />
          <button
            onClick={() =>
              updateInstituteName('Updated Blockchain Institute 2')
            }
            className="rounded bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600"
          >
            Update Name
          </button>
        </div>

        {institute && (
          <div className="mt-6 text-left text-black">
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
              {institute[4].map((course, idx) => (
                <li key={idx}>{course.degree_name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
