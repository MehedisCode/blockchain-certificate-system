// AddInstitutePage.jsx
import React, { useMemo, useState } from 'react';
import {
  TextField,
  Button,
  Box,
  CircularProgress,
  Snackbar,
  Stack,
} from '@mui/material';
import { ethers } from 'ethers';
import INSTITUTION_ABI from '../contracts/Institution.json';

const AddInstitutePage = () => {
  const [instituteWallet, setInstituteWallet] = useState(''); // 0x... address for the institute
  const [instituteName, setInstituteName] = useState('');
  const [instituteAddrText, setInstituteAddrText] = useState(''); // postal/physical address text
  const [instituteAcronym, setInstituteAcronym] = useState('');
  const [instituteLink, setInstituteLink] = useState('');

  // optional comma-separated inputs for simplicity
  const [degreesCsv, setDegreesCsv] = useState('');
  const [departmentsCsv, setDepartmentsCsv] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccess] = useState('');
  const [errorMessage, setError] = useState('');

  // Build arrays from CSV, trimming empties
  const degrees = useMemo(
    () =>
      degreesCsv
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    [degreesCsv]
  );

  const departments = useMemo(
    () =>
      departmentsCsv
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    [departmentsCsv]
  );

  const handleAddInstitute = async () => {
    // Basic validations
    if (
      !instituteWallet ||
      !instituteName ||
      !instituteAddrText ||
      !instituteAcronym ||
      !instituteLink
    ) {
      setError('All fields are required (including the institute wallet)!');
      return;
    }

    // Validate Ethereum address
    let instituteWalletChecksum;
    try {
      instituteWalletChecksum = ethers.getAddress(instituteWallet);
    } catch {
      setError('Invalid institute wallet address (must be 0x...)');
      return;
    }

    try {
      if (!window.ethereum) {
        setError('MetaMask is not available in this browser.');
        return;
      }

      setLoading(true);

      // v6: BrowserProvider + awaited signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();

      //   Ensure only the Admin (contract owner) calls addInstitute
      //   (optional client-side check if you want)
      const adminEnv = import.meta.env.VITE_ADMIN_WALLET_ADDRESS?.toLowerCase();
      const caller = (await signer.getAddress()).toLowerCase();
      if (caller !== adminEnv) {
        setError('Only admin can add institutes.');
        setLoading(false);
        return;
      }

      const contractAddress = import.meta.env.VITE_INSTITUTION_CONTRACT_ADDRESS;
      if (!contractAddress) {
        setError('VITE_INSTITUTION_CONTRACT_ADDRESS is not set.');
        setLoading(false);
        return;
      }

      // quick code presence check
      const code = await provider.getCode(contractAddress);
      if (code === '0x') {
        setError(
          'No contract found at VITE_INSTITUTION_CONTRACT_ADDRESS (wrong network or bad address).'
        );
        setLoading(false);
        return;
      }

      // signer-backed instance (we’re writing)
      const institutionContract = new ethers.Contract(
        contractAddress,
        INSTITUTION_ABI.abi,
        signer
      );

      // Your current fallbacks
      const degreeList = degrees.length ? degrees : ['General'];
      const departmentList = departments.length ? departments : ['Main'];

      // 👇 encode for tuple[] (struct[]) as the ABI expects
      const degreeStructs = degreeList.map(name => ({ degree_name: name }));
      const departmentStructs = departmentList.map(name => ({
        department_name: name,
      }));

      // NOTE: ABI is declared with (string)[] for tuples, so pass strings only (positional form)
      // If you compile ABI from Hardhat JSON with named components, you can also pass objects of the form { degree_name: "..." }.
      const tx = await institutionContract.addInstitute(
        instituteWalletChecksum,
        instituteName,
        instituteAddrText,
        instituteAcronym,
        instituteLink,
        degreeStructs, // <-- tuple[]: { degree_name: string }
        departmentStructs // <-- tuple[]: { department_name: string }
      );

      await tx.wait();

      setSuccess('Institute added successfully!');
      // reset form
      setInstituteWallet('');
      setInstituteName('');
      setInstituteAddrText('');
      setInstituteAcronym('');
      setInstituteLink('');
      setDegreesCsv('');
      setDepartmentsCsv('');
    } catch (err) {
      console.error(err);
      // surface a helpful revert if it’s the “only owner” require
      const msg = (
        err?.info?.error?.message ||
        err?.shortMessage ||
        err?.message ||
        ''
      ).toString();
      if (
        msg.includes('only owner') ||
        msg.includes('Caller must be the owner')
      ) {
        setError(
          'Transaction reverted: only the admin (contract owner) can add an institute.'
        );
      } else if (
        msg.includes('Atleast one degree') ||
        msg.includes('Atleast one department')
      ) {
        setError(
          'This contract requires at least one degree and one department.'
        );
      } else {
        setError('Failed to add institute. See console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', p: 3 }}>
      <h2>Add New Institute</h2>

      <Stack spacing={2}>
        <TextField
          label="Institute Wallet (0x...)"
          value={instituteWallet}
          onChange={e => setInstituteWallet(e.target.value)}
          placeholder="0xabc..."
          fullWidth
        />
        <TextField
          label="Institute Name"
          value={instituteName}
          onChange={e => setInstituteName(e.target.value)}
          fullWidth
        />
        <TextField
          label="Institute Physical Address"
          value={instituteAddrText}
          onChange={e => setInstituteAddrText(e.target.value)}
          fullWidth
        />
        <TextField
          label="Institute Acronym"
          value={instituteAcronym}
          onChange={e => setInstituteAcronym(e.target.value)}
          fullWidth
        />
        <TextField
          label="Institute Website"
          value={instituteLink}
          onChange={e => setInstituteLink(e.target.value)}
          placeholder="https://..."
          fullWidth
        />

        {/* Optional: comma-separated lists. If left blank, we’ll send placeholders */}
        <TextField
          label="Degrees (comma-separated) — optional"
          value={degreesCsv}
          onChange={e => setDegreesCsv(e.target.value)}
          placeholder="BSc, MSc"
          fullWidth
        />
        <TextField
          label="Departments (comma-separated) — optional"
          value={departmentsCsv}
          onChange={e => setDepartmentsCsv(e.target.value)}
          placeholder="CSE, EEE"
          fullWidth
        />

        {loading ? (
          <CircularProgress />
        ) : (
          <Button variant="contained" onClick={handleAddInstitute}>
            Add Institute
          </Button>
        )}
      </Stack>

      <Snackbar
        open={!!successMessage}
        message={successMessage}
        autoHideDuration={5000}
        onClose={() => setSuccess('')}
      />
      <Snackbar
        open={!!errorMessage}
        message={errorMessage}
        autoHideDuration={6000}
        onClose={() => setError('')}
      />
    </Box>
  );
};

export default AddInstitutePage;
