import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Fade,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Divider,
  Paper,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Link,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNewOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import VerifiedIcon from '@mui/icons-material/Verified';
import BlockIcon from '@mui/icons-material/Block';
import DescriptionIcon from '@mui/icons-material/Description';
import SearchIcon from '@mui/icons-material/Search';
import { ethers } from 'ethers';
import { IPFSService } from '../utils/ipfsService';
import CertificationAbi from '../contracts/Certification.json';

const certificationAddress = import.meta.env.VITE_CERTIFICATION_ADDRESS;

const steps = ['Enter ID', 'Blockchain Verification', 'View Certificate'];

const ViewCertificate = () => {
  const [certId, setCertId] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Verification results
  const [verificationResult, setVerificationResult] = useState(null);
  const [certificateData, setCertificateData] = useState(null);
  const [ipfsFileInfo, setIpfsFileInfo] = useState(null);

  const baseUrl = `${window.location.origin}/certificate`;

  const handleCopyLink = () => {
    if (certId.trim() === '') {
      setError('Please enter a certificate ID first.');
      return;
    }
    setError('');
    const fullLink = `${baseUrl}/${certId}`;
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const verifyCertificate = async () => {
    if (certId.trim() === '') {
      setError('Please enter a certificate ID.');
      return;
    }

    setLoading(true);
    setError('');
    setVerificationResult(null);
    setCertificateData(null);
    setIpfsFileInfo(null);
    setActiveStep(1);

    try {
      // Connect to blockchain
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to verify certificates');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        certificationAddress,
        CertificationAbi.abi,
        provider
      );

      // Step 1: Verify on blockchain
      console.log('Verifying certificate on blockchain...');
      const verification = await contract.verifyCertificate(certId);

      const [exists, valid, revoked, hasIpfs, ipfsHash] = verification;

      if (!exists) {
        throw new Error('Certificate not found on blockchain');
      }

      setVerificationResult({
        exists,
        valid,
        revoked,
        hasIpfs,
        ipfsHash,
      });

      // Step 2: Get certificate details
      try {
        const basicInfo = await contract.getCertificateBasic(certId);
        const details = await contract.getCertificateDetails(certId);

        const certificateData = {
          // Basic Info
          candidateName: basicInfo[0],
          candidateId: basicInfo[1],
          degreeName: basicInfo[2],
          departmentName: basicInfo[3],
          instituteAcronym: basicInfo[4],
          issueDate: basicInfo[5],
          revoked: basicInfo[6],
          hasIpfs: basicInfo[7],
          issuedBy: basicInfo[8],

          // Details
          fatherName: details[0],
          motherName: details[1],
          cgpa: details[2],
          session: details[3],
          instituteName: details[4],
          instituteAddress: details[5],
          instituteLink: details[6],
          ipfsHash: details[7],

          // Metadata
          certificateId: certId,
          verifiedOn: new Date().toISOString(),
        };

        setCertificateData(certificateData);

        // Step 3: Check IPFS file if available
        if (hasIpfs && ipfsHash) {
          const ipfsUrl = IPFSService.getIPFSFileUrl(ipfsHash);
          const gateways = IPFSService.getAllGatewayUrls(ipfsHash);

          setIpfsFileInfo({
            ipfsHash,
            primaryUrl: ipfsUrl,
            gateways,
            isValidHash: IPFSService.isValidIPFSHash(ipfsHash),
          });
        }

        setActiveStep(2);
        setError('');
      } catch (detailsError) {
        console.warn('Could not fetch certificate details:', detailsError);
        // Still show verification result even if details fail
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message || 'Certificate verification failed');
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCertificate = () => {
    if (certId.trim() === '') {
      setError('Please enter a certificate ID first.');
      return;
    }
    window.open(`${baseUrl}/${certId}`, '_blank');
  };

  const handleOpenIPFS = url => {
    window.open(url, '_blank');
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter') {
      verifyCertificate();
    }
  };

  const resetVerification = () => {
    setCertId('');
    setError('');
    setVerificationResult(null);
    setCertificateData(null);
    setIpfsFileInfo(null);
    setActiveStep(0);
  };

  const getVerificationStatusColor = () => {
    if (!verificationResult) return 'default';
    if (!verificationResult.valid) return 'error';
    if (verificationResult.hasIpfs) return 'success';
    return 'primary';
  };

  const getVerificationStatusIcon = () => {
    if (!verificationResult) return null;
    if (!verificationResult.valid) return <BlockIcon />;
    if (verificationResult.hasIpfs) return <VerifiedIcon />;
    return <CheckCircleIcon />;
  };

  const getVerificationStatusText = () => {
    if (!verificationResult) return 'Not Verified';
    if (verificationResult.revoked) return 'Revoked';
    if (!verificationResult.valid) return 'Invalid';
    if (verificationResult.hasIpfs) return 'Verified with IPFS';
    return 'Verified (No IPFS)';
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      {/* Header */}
      <Typography variant="h4" align="center" color="primary" gutterBottom>
        Verify Certificate
      </Typography>
      <Typography
        variant="subtitle1"
        align="center"
        color="text.secondary"
        sx={{ mb: 4 }}
      >
        Enter a certificate ID to verify its authenticity on the blockchain and
        IPFS
      </Typography>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map(label => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Step 1: Enter Certificate ID */}
      {activeStep === 0 && (
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <Card
            sx={{ border: '2px solid', borderColor: 'primary.main', mb: 3 }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                Enter Certificate ID
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Certificate ID is case-sensitive
              </Typography>
            </CardContent>
          </Card>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                label="Certificate ID"
                variant="outlined"
                fullWidth
                value={certId}
                onChange={e => setCertId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., CERT-2024-001 or UUID"
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                color="primary"
                onClick={verifyCertificate}
                disabled={loading || !certId.trim()}
                fullWidth
                startIcon={
                  loading ? <CircularProgress size={20} /> : <SearchIcon />
                }
                size="large"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </Button>
            </Grid>
          </Grid>

          <Box
            sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}
          >
            <Button
              variant="outlined"
              color={copied ? 'success' : 'primary'}
              onClick={handleCopyLink}
              startIcon={<ContentCopyIcon />}
              disabled={!certId.trim()}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleOpenCertificate}
              endIcon={<OpenInNewIcon />}
              disabled={!certId.trim()}
            >
              Open Certificate
            </Button>
          </Box>

          {/* Demo IDs */}
          <Box mt={4} textAlign="center">
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Try with these Demo Certificate IDs:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              b6b72e2b-d5dc-47dc-bf28-1d39e42b8fd3
            </Typography>
            <Typography variant="body2" color="text.secondary">
              5a61d8ed-15bd-4e34-953e-44029f4bbbd6
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Step 2: Verification Results */}
      {activeStep >= 1 && verificationResult && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Chip
              icon={getVerificationStatusIcon()}
              label={getVerificationStatusText()}
              color={getVerificationStatusColor()}
              variant="outlined"
              sx={{
                mr: 2,
                fontSize: '1rem',
                padding: '8px 16px',
                height: 'auto',
              }}
            />
            <Typography variant="body2" color="text.secondary">
              Certificate ID: <strong>{certId}</strong>
            </Typography>
            <Button
              size="small"
              onClick={resetVerification}
              sx={{ ml: 'auto' }}
            >
              Verify Another
            </Button>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            {/* Blockchain Verification */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom color="primary">
                Blockchain Verification
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2">
                  <strong>Status:</strong>{' '}
                  {verificationResult.valid ? (
                    <Chip
                      label="Active"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  ) : verificationResult.revoked ? (
                    <Chip
                      label="Revoked"
                      size="small"
                      color="error"
                      variant="outlined"
                    />
                  ) : (
                    <Chip
                      label="Invalid"
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  )}
                </Typography>
                <Typography variant="body2">
                  <strong>Existence:</strong>{' '}
                  {verificationResult.exists ? 'Confirmed' : 'Not Found'}
                </Typography>
                <Typography variant="body2">
                  <strong>IPFS Storage:</strong>{' '}
                  {verificationResult.hasIpfs ? 'Available' : 'Not Available'}
                </Typography>
                {verificationResult.issuedBy && (
                  <Typography variant="body2">
                    <strong>Issued By:</strong>{' '}
                    <Link
                      href={`https://sepolia.etherscan.io/address/${verificationResult.issuedBy}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {verificationResult.issuedBy.slice(0, 10)}...
                    </Link>
                  </Typography>
                )}
              </Box>
            </Grid>

            {/* IPFS Verification */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom color="primary">
                IPFS File Storage
              </Typography>
              {verificationResult.hasIpfs && verificationResult.ipfsHash ? (
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    <strong>IPFS Hash:</strong> {verificationResult.ipfsHash}
                  </Typography>
                  <Box
                    sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<OpenInNewIcon />}
                      onClick={() =>
                        handleOpenIPFS(
                          IPFSService.getIPFSFileUrl(
                            verificationResult.ipfsHash
                          )
                        )
                      }
                    >
                      View File
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          verificationResult.ipfsHash
                        )
                      }
                    >
                      Copy Hash
                    </Button>
                  </Box>
                  {ipfsFileInfo?.gateways &&
                    ipfsFileInfo.gateways.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Alternative gateways:
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 0.5,
                            mt: 0.5,
                          }}
                        >
                          {ipfsFileInfo.gateways
                            .slice(0, 3)
                            .map((gateway, idx) => (
                              <Chip
                                key={idx}
                                label={`Gateway ${idx + 1}`}
                                size="small"
                                onClick={() => handleOpenIPFS(gateway)}
                                variant="outlined"
                              />
                            ))}
                        </Box>
                      </Box>
                    )}
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ pl: 2 }}
                >
                  No IPFS file attached to this certificate
                </Typography>
              )}
            </Grid>
          </Grid>

          {/* Certificate Details Preview */}
          {certificateData && activeStep === 2 && (
            <Box sx={{ mt: 4 }}>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="subtitle1" gutterBottom color="primary">
                Certificate Details
              </Typography>

              <Paper variant="outlined" sx={{ p: 3, bgcolor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Student:</strong> {certificateData.candidateName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Student ID:</strong> {certificateData.candidateId}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Program:</strong> {certificateData.degreeName} -{' '}
                      {certificateData.departmentName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>CGPA:</strong> {certificateData.cgpa}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Session:</strong> {certificateData.session}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Institute:</strong>{' '}
                      {certificateData.instituteName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Issue Date:</strong> {certificateData.issueDate}
                    </Typography>
                    {certificateData.fatherName && (
                      <Typography variant="body2">
                        <strong>Father:</strong> {certificateData.fatherName}
                      </Typography>
                    )}
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleOpenCertificate}
                    startIcon={<DescriptionIcon />}
                  >
                    View Full Certificate
                  </Button>
                  {verificationResult.hasIpfs && (
                    <Button
                      variant="outlined"
                      onClick={() =>
                        handleOpenIPFS(
                          IPFSService.getIPFSFileUrl(
                            verificationResult.ipfsHash
                          )
                        )
                      }
                      startIcon={<OpenInNewIcon />}
                    >
                      View Certificate File
                    </Button>
                  )}
                </Box>
              </Paper>
            </Box>
          )}
        </Paper>
      )}

      {/* Information Box */}
      <Paper sx={{ p: 3, mt: 4, bgcolor: 'info.light' }}>
        <Typography variant="subtitle1" gutterBottom>
          How Verification Works
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                1
              </Typography>
              <Typography variant="body2">
                <strong>Blockchain Check</strong>
                <br />
                Verify certificate exists on Ethereum blockchain
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                2
              </Typography>
              <Typography variant="body2">
                <strong>IPFS Verification</strong>
                <br />
                Check if certificate file is stored on IPFS
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                3
              </Typography>
              <Typography variant="body2">
                <strong>Status Validation</strong>
                <br />
                Confirm certificate is active and not revoked
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            Certificates with IPFS storage include the actual certificate file
            (PDF/Image) stored on decentralized IPFS network for enhanced
            authenticity.
          </Typography>
        </Alert>
      </Paper>
    </Container>
  );
};

export default ViewCertificate;
