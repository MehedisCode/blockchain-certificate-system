// AddInstitutePage.jsx
import React, { useMemo, useState } from 'react';
import {
  TextField,
  Button,
  Box,
  CircularProgress,
  Snackbar,
  Stack,
  Alert,
  Typography,
  Paper,
  Grid, // ADD THIS IMPORT
} from '@mui/material';
import { ethers } from 'ethers';
import INSTITUTION_ABI from '../contracts/Institution.json';

const AddInstitutePage = () => {
  const [instituteWallet, setInstituteWallet] = useState('');
  const [instituteName, setInstituteName] = useState('');
  const [instituteAddrText, setInstituteAddrText] = useState('');
  const [instituteAcronym, setInstituteAcronym] = useState('');
  const [instituteLink, setInstituteLink] = useState('');
  const [degreesCsv, setDegreesCsv] = useState('');
  const [departmentsCsv, setDepartmentsCsv] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccess] = useState('');
  const [errorMessage, setError] = useState('');

  // Build arrays from CSV
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
      setError('All fields are required!');
      return;
    }

    // Validate Ethereum address
    let instituteWalletChecksum;
    try {
      instituteWalletChecksum = ethers.getAddress(instituteWallet);
    } catch {
      setError('Invalid wallet address (must be 0x...)');
      return;
    }

    try {
      if (!window.ethereum) {
        setError('MetaMask is not available.');
        return;
      }

      setLoading(true);
      setError('');

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();

      // Check if caller is admin (optional)
      const adminEnv = import.meta.env.VITE_ADMIN_WALLET_ADDRESS?.toLowerCase();
      const caller = (await signer.getAddress()).toLowerCase();

      if (adminEnv && caller !== adminEnv) {
        setError('Only admin can add institutes.');
        setLoading(false);
        return;
      }

      const contractAddress = import.meta.env.VITE_INSTITUTION_CONTRACT_ADDRESS;
      if (!contractAddress) {
        setError('Contract address not configured.');
        setLoading(false);
        return;
      }

      // Check contract exists
      const code = await provider.getCode(contractAddress);
      if (code === '0x') {
        setError('No contract found at this address.');
        setLoading(false);
        return;
      }

      const institutionContract = new ethers.Contract(
        contractAddress,
        INSTITUTION_ABI.abi,
        signer
      );

      // ✅ FIXED: Use arrays of strings, NOT struct objects
      // Your contract expects: string[] memory initialDegrees, string[] memory initialDepartments
      const degreeList = degrees.length > 0 ? degrees : ['General'];
      const departmentList = departments.length > 0 ? departments : ['Main'];

      console.log('Calling addInstitute with:', {
        wallet: instituteWalletChecksum,
        name: instituteName,
        address: instituteAddrText,
        acronym: instituteAcronym,
        link: instituteLink,
        degrees: degreeList,
        departments: departmentList,
      });

      // ✅ Correct way: Pass arrays of strings
      const tx = await institutionContract.addInstitute(
        instituteWalletChecksum, // address
        instituteName, // string
        instituteAddrText, // string
        instituteAcronym, // string
        instituteLink, // string
        degreeList, // string[] (NOT struct[])
        departmentList // string[] (NOT struct[])
      );

      console.log('Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      setSuccess(
        `Institute "${instituteName}" added successfully! Transaction: ${tx.hash.slice(0, 10)}...`
      );

      // Reset form
      setInstituteWallet('');
      setInstituteName('');
      setInstituteAddrText('');
      setInstituteAcronym('');
      setInstituteLink('');
      setDegreesCsv('');
      setDepartmentsCsv('');
    } catch (err) {
      console.error('Error adding institute:', err);

      // Parse error message
      let errorMsg = 'Failed to add institute.';

      if (err.message) {
        // Check for specific error patterns
        if (err.message.includes('revert')) {
          if (
            err.message.includes('only owner') ||
            err.message.includes('Only owner')
          ) {
            errorMsg = 'Only contract owner (admin) can add institutes.';
          } else if (err.message.includes('already exists')) {
            errorMsg = 'Institute with this wallet already exists.';
          } else if (
            err.message.includes('Atleast one degree') ||
            err.message.includes('At least one degree')
          ) {
            errorMsg = 'At least one degree is required.';
          } else if (
            err.message.includes('Atleast one department') ||
            err.message.includes('At least one department')
          ) {
            errorMsg = 'At least one department is required.';
          } else {
            errorMsg = `Transaction reverted: ${err.message.split('revert')[1]?.slice(0, 100)}...`;
          }
        } else if (err.message.includes('user rejected')) {
          errorMsg = 'Transaction was rejected by user.';
        } else if (err.message.includes('insufficient funds')) {
          errorMsg = 'Insufficient funds for gas.';
        } else {
          errorMsg = err.message;
        }
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter') {
      handleAddInstitute();
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">
        Add New Institute
      </Typography>

      <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
        <Typography variant="body2" color="text.secondary">
          Add a new institute to the blockchain. The institute wallet address
          will be able to issue certificates.
        </Typography>
      </Paper>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Stack spacing={3}>
        <TextField
          label="Institute Wallet Address *"
          value={instituteWallet}
          onChange={e => setInstituteWallet(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="0x742d35Cc6634C0532925a3b844Bc9e... (Ethereum address)"
          fullWidth
          required
          helperText="The wallet address that will issue certificates"
        />

        <TextField
          label="Institute Name *"
          value={instituteName}
          onChange={e => setInstituteName(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="University of Technology"
          fullWidth
          required
        />

        <TextField
          label="Physical Address *"
          value={instituteAddrText}
          onChange={e => setInstituteAddrText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="123 Education Street, City, Country"
          fullWidth
          required
        />

        <TextField
          label="Institute Acronym *"
          value={instituteAcronym}
          onChange={e => setInstituteAcronym(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="UOT"
          fullWidth
          required
          helperText="Short form (max 10 characters recommended)"
        />

        <TextField
          label="Institute Website *"
          value={instituteLink}
          onChange={e => setInstituteLink(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="https://www.university.edu"
          fullWidth
          required
        />

        <TextField
          label="Degrees (comma-separated) *"
          value={degreesCsv}
          onChange={e => setDegreesCsv(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Bachelor of Science, Master of Arts, PhD"
          fullWidth
          required
          helperText="At least one degree is required. Example: BSc, MSc, PhD"
        />

        <TextField
          label="Departments (comma-separated) *"
          value={departmentsCsv}
          onChange={e => setDepartmentsCsv(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Computer Science, Electrical Engineering, Mathematics"
          fullWidth
          required
          helperText="At least one department is required"
        />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Required fields marked with *
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={handleAddInstitute}
            disabled={loading}
            size="large"
            sx={{ minWidth: 150 }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Processing...
              </>
            ) : (
              'Add Institute'
            )}
          </Button>
        </Box>
      </Stack>

      {/* Preview Section */}
      {(degrees.length > 0 || departments.length > 0) && (
        <Paper sx={{ p: 3, mt: 4, bgcolor: 'info.light' }}>
          <Typography variant="subtitle1" gutterBottom>
            Preview
          </Typography>
          <Grid container spacing={2}>
            {degrees.length > 0 && (
              <Grid item xs={12} md={6}>
                <Typography variant="body2">
                  <strong>Degrees:</strong> {degrees.join(', ')}
                </Typography>
              </Grid>
            )}
            {departments.length > 0 && (
              <Grid item xs={12} md={6}>
                <Typography variant="body2">
                  <strong>Departments:</strong> {departments.join(', ')}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      <Snackbar
        open={!!successMessage}
        message={successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      />
    </Box>
  );
};

export default AddInstitutePage;
