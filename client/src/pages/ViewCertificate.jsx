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
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNewOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const ViewCertificate = () => {
  const [certId, setCertId] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

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

  const handleOpenLink = async () => {
    if (certId.trim() === '') {
      setError('Please enter a certificate ID first.');
      return;
    }
    setError('');

    try {
      const res = await fetch(`${baseUrl}/${certId}.json`);

      window.open(`${baseUrl}/${certId}`, '_blank');
    } catch (err) {
      setError('Certificate not found or invalid.');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Typography variant="h4" align="center" color="primary" gutterBottom>
        Verify Certificate
      </Typography>
      <Typography
        variant="subtitle1"
        align="center"
        color="text.secondary"
        sx={{ mb: 4 }}
      >
        Enter a certificate ID to verify its authenticity from the blockchain.
      </Typography>

      <Box
        sx={{
          p: 4,
          borderRadius: 2,
          boxShadow: 2,
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Card sx={{ border: '2px solid #673ab7', mb: 3, width: '100%' }}>
          <CardContent>
            <Typography variant="h6" align="center" color="primary">
              Enter Certificate ID
            </Typography>
          </CardContent>
        </Card>

        <TextField
          label="Certificate ID"
          variant="outlined"
          fullWidth
          value={certId}
          onChange={e => setCertId(e.target.value)}
          sx={{ maxWidth: 400 }}
          error={Boolean(error)}
          helperText={error}
        />

        <Fade in={certId.trim() !== ''} timeout={500}>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color={copied ? 'success' : 'primary'}
              onClick={handleCopyLink}
              startIcon={<ContentCopyIcon />}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpenLink}
              endIcon={<OpenInNewIcon />}
            >
              Open Link
            </Button>
          </Box>
        </Fade>
      </Box>

      <Box mt={4} textAlign="center">
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Try with these Demo Certificate IDs:
        </Typography>
        <Typography variant="body2">
          b6b72e2b-d5dc-47dc-bf28-1d39e42b8fd3
        </Typography>
        <Typography variant="body2">
          5a61d8ed-15bd-4e34-953e-44029f4bbbd6
        </Typography>
      </Box>
    </Container>
  );
};

export default ViewCertificate;
