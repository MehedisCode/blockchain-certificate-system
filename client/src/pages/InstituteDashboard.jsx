import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  FileUpload,
  Verified,
  Block,
  Description,
  School,
  Group,
} from '@mui/icons-material';
import IssueCertificateForm from '../components/Certificate/IssueCertificateForm';
import IPFSDashboard from '../components/IPFS/IPFSDashboard';
import { CertificateContract } from '../utils/certificateContract';
import { ethers } from 'ethers';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const InstituteDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [instituteData, setInstituteData] = useState(null);
  const [certificateCount, setCertificateCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    loadInstituteData();
  }, []);

  const loadInstituteData = async () => {
    setLoading(true);
    try {
      // Get current wallet address
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);

        // Check if address is an institute
        const isInstitute = await CertificateContract.isInstitute(address);

        if (!isInstitute) {
          setError('Connected wallet is not registered as an institute');
          setLoading(false);
          return;
        }

        // Load institute data
        const data = await CertificateContract.getInstituteData(address);
        setInstituteData(data);

        // Load certificate count
        const count = await CertificateContract.getCertificateCount(address);
        setCertificateCount(count);
      }
    } catch (error) {
      console.error('Error loading institute data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading institute dashboard...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadInstituteData}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Institute Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {instituteData?.name || 'Institute Management Portal'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Chip
            icon={<School />}
            label={`Acronym: ${instituteData?.acronym || 'N/A'}`}
            variant="outlined"
          />
          <Chip
            icon={<Group />}
            label={`Certificates Issued: ${certificateCount}`}
            color="primary"
          />
          <Chip
            icon={<Verified />}
            label="Verified Institute"
            color="success"
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Issue Certificate" icon={<Description />} />
          <Tab label="IPFS Storage" icon={<FileUpload />} />
          <Tab label="Certificate History" icon={<Verified />} />
          <Tab label="Institute Settings" icon={<School />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={activeTab} index={0}>
        <IssueCertificateForm
          instituteAddress={walletAddress}
          instituteData={instituteData}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <IPFSDashboard />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Certificate History
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Certificate history will be displayed here. Currently showing{' '}
              {certificateCount} certificates.
            </Alert>
            {/* TODO: Add certificate list table */}
            <Typography variant="body2" color="text.secondary">
              Certificate listing feature coming soon...
            </Typography>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Institute Information
                </Typography>
                {instituteData && (
                  <Box>
                    <Typography>
                      <strong>Name:</strong> {instituteData.name}
                    </Typography>
                    <Typography>
                      <strong>Acronym:</strong> {instituteData.acronym}
                    </Typography>
                    <Typography>
                      <strong>Address:</strong> {instituteData.addressLine}
                    </Typography>
                    <Typography>
                      <strong>Website:</strong>
                      <a
                        href={instituteData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {instituteData.website}
                      </a>
                    </Typography>
                    <Typography>
                      <strong>Degrees:</strong>{' '}
                      {instituteData.degrees?.length || 0}
                    </Typography>
                    <Typography>
                      <strong>Departments:</strong>{' '}
                      {instituteData.departments?.length || 0}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Wallet Information
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ wordBreak: 'break-all', mb: 2 }}
                >
                  <strong>Address:</strong> {walletAddress}
                </Typography>
                <Button variant="outlined" size="small" sx={{ mr: 1 }}>
                  Copy Address
                </Button>
                <Button variant="outlined" size="small">
                  View on Etherscan
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Container>
  );
};

export default InstituteDashboard;
