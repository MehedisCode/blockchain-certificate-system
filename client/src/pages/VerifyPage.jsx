import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Card,
  CardContent,
  CircularProgress,
  Grid,
} from '@mui/material';
import { Search, Verified, Block } from '@mui/icons-material';
import CertificateViewer from '../components/Certificate/CertificateViewer';
import { CertificateContract } from '../utils/certificateContract';

const VerifyPage = () => {
  const [certificateId, setCertificateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [certificateData, setCertificateData] = useState(null);

  const handleVerify = async () => {
    if (!certificateId.trim()) {
      setError('Please enter a certificate ID');
      return;
    }

    setLoading(true);
    setError('');
    setVerificationResult(null);
    setCertificateData(null);

    try {
      // First verify with new contract
      const verification =
        await CertificateContract.verifyCertificate(certificateId);

      if (verification.exists) {
        setVerificationResult({
          exists: true,
          valid: verification.valid,
          revoked: verification.revoked,
          hasIpfs: verification.hasIpfs,
          ipfsHash: verification.ipfsHash,
          fromNewContract: true,
        });

        // Get full certificate data
        const data =
          await CertificateContract.getCertificateData(certificateId);
        setCertificateData(data);
      } else {
        // Try old contract
        setVerificationResult({
          exists: false,
          message: 'Certificate not found in the system',
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError(`Verification failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Verify Certificate
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Enter a certificate ID to verify its authenticity on the blockchain
        </Typography>
      </Box>

      {/* Search Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Enter Certificate ID
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            label="Certificate ID"
            value={certificateId}
            onChange={e => setCertificateId(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., CERT-2024-001"
            disabled={loading}
          />
          <Button
            variant="contained"
            onClick={handleVerify}
            disabled={loading || !certificateId.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <Search />}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Example: CERT-2024-001, DIPLOMA-2023-MATH-123
        </Typography>
      </Paper>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Verification Result */}
      {verificationResult && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {verificationResult.exists ? (
                verificationResult.valid ? (
                  <>
                    <Verified color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6" color="success.main">
                      ✓ Certificate Verified
                    </Typography>
                  </>
                ) : (
                  <>
                    <Block color="error" sx={{ mr: 1 }} />
                    <Typography variant="h6" color="error.main">
                      ✗ Certificate Revoked
                    </Typography>
                  </>
                )
              ) : (
                <>
                  <Block color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="warning.main">
                    Certificate Not Found
                  </Typography>
                </>
              )}
            </Box>

            {verificationResult.exists && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="body1">
                    {verificationResult.valid ? 'Active' : 'Revoked'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    IPFS Storage
                  </Typography>
                  <Typography variant="body1">
                    {verificationResult.hasIpfs ? 'Available' : 'Not Available'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Contract Version
                  </Typography>
                  <Typography variant="body1">
                    {verificationResult.fromNewContract
                      ? 'New (with IPFS)'
                      : 'Legacy'}
                  </Typography>
                </Grid>
                {verificationResult.ipfsHash && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      IPFS Hash
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        wordBreak: 'break-all',
                        fontFamily: 'monospace',
                        bgcolor: 'grey.100',
                        p: 1,
                        borderRadius: 1,
                      }}
                    >
                      {verificationResult.ipfsHash}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            )}
          </CardContent>
        </Card>
      )}

      {/* Certificate Viewer */}
      {certificateData && <CertificateViewer certificate={certificateData} />}

      {/* Info Section */}
      <Paper sx={{ p: 3, mt: 4, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          How Verification Works
        </Typography>
        <Typography variant="body2" paragraph>
          1. <strong>Blockchain Check:</strong> The certificate ID is checked on
          the Ethereum blockchain
        </Typography>
        <Typography variant="body2" paragraph>
          2. <strong>IPFS Verification:</strong> If available, the certificate
          file is retrieved from IPFS
        </Typography>
        <Typography variant="body2" paragraph>
          3. <strong>Institute Validation:</strong> The issuing institute's
          identity is verified
        </Typography>
        <Typography variant="body2">
          4. <strong>Status Check:</strong> Certificate revocation status is
          checked
        </Typography>
      </Paper>
    </Container>
  );
};

export default VerifyPage;
