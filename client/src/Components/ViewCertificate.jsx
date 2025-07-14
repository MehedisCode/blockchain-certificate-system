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

  const baseUrl = `${window.location.origin}/certificate`;

  const handleCopyLink = () => {
    const fullLink = `${baseUrl}/${certId}`;
    navigator.clipboard.writeText(fullLink);
  };

  const handleOpenLink = () => {
    const fullLink = `${baseUrl}/${certId}`;
    window.open(fullLink, '_blank');
  };

  return (
    <Container maxWidth="md" sx={{ mt: 6 }}>
      <Typography variant="h4" align="center" color="primary" gutterBottom>
        Welcome, Employers
      </Typography>
      <Typography
        variant="subtitle1"
        align="center"
        color="text.secondary"
        sx={{ mb: 4 }}
      >
        You may key in the certificate ID to view the verified certificate
        created on the Ethereum blockchain.
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
        <Card sx={{ border: '2px solid #673ab7', mb: 3 }}>
          <CardContent>
            <Typography variant="h6" align="center" color="primary">
              View Certificate
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
        />

        <Fade in={certId !== ''} timeout={500}>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleCopyLink}
              startIcon={<ContentCopyIcon />}
            >
              Copy Link
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
          Demo Certificate IDs (Try these):
        </Typography>
        <Typography variant="body2">
          5085cd9b-bf21-41ab-a668-6769c248806d
        </Typography>
        <Typography variant="body2">
          5a61d8ed-15bd-4e34-953e-44029f4bbbd6
        </Typography>
      </Box>
    </Container>
  );
};

export default ViewCertificate;
