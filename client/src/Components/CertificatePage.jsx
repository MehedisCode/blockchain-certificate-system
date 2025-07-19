import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import CertificationAbi from '../contracts/Certification.json';
import CertificatePDFGenerator from './CertificatePDFGenerator';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
  Chip,
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import '../App.css';

const certificationAddress = import.meta.env.VITE_CERTIFICATION_ADDRESS;

const CertificatePage = () => {
  const { id } = useParams();
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [certExists, setCertExists] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  // Use CertificatePDFGenerator component
  const {
    pdfDataUri,
    error: pdfError,
    generatePDF,
  } = CertificatePDFGenerator({ certData, id });

  useEffect(() => {
    const loadCertificate = async () => {
      setLoading(true);
      try {
        if (!window.ethereum) {
          alert('Please install MetaMask!');
          throw new Error('MetaMask not installed');
        }
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(
          certificationAddress,
          CertificationAbi.abi,
          provider
        );
        console.log('Fetching certificate data for ID:', id);
        const data = await contract.getData(id);

        const newCertData = {
          candidateName: data[0],
          candidateId: data[1],
          fatherName: data[2],
          motherName: data[3],
          degreeName: data[4],
          departmentName: data[5],
          cgpa: data[6],
          session: data[7],
          creationDate: data[8],
          instituteName: data[9],
          instituteAddress: data[10],
          instituteAcronym: data[11],
          instituteLink: data[12],
          revoked: data[13],
        };
        console.log('Certificate data fetched:', newCertData);
        setCertData(newCertData);
        setCertExists(true);
      } catch (error) {
        console.error('Certificate not found or error:', error);
        setCertExists(false);
      } finally {
        setLoading(false);
      }
    };
    loadCertificate();
  }, [id]);

  const downloadPDF = () => {
    if (pdfDataUri) {
      const link = document.createElement('a');
      link.href = pdfDataUri;
      link.download = `${certData?.candidateName || 'Certificate'}_Certificate.pdf`;
      link.click();
    } else {
      console.error('Download PDF: No pdfDataUri available');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">Loading Certificate...</Typography>
      </Box>
    );
  }

  if (!certExists) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Certificate with ID "{id}" not found.
        </Typography>
        {pdfError && (
          <Typography variant="body1" color="error" sx={{ mt: 2 }}>
            {pdfError}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" align="center" sx={{ mb: 4, color: '#363e98' }}>
        Blockchain Credential Certificate
      </Typography>
      {pdfError && (
        <Typography variant="body1" color="error" align="center" sx={{ mb: 2 }}>
          {pdfError}
        </Typography>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
        <Button
          variant="contained"
          onClick={() => generatePDF(certData)}
          disabled={!certData}
          sx={{
            backgroundColor: '#363e98',
            '&:hover': { backgroundColor: '#2a2e7a' },
          }}
        >
          Regenerate Certificate
        </Button>
        <Button
          variant="contained"
          onClick={downloadPDF}
          disabled={!pdfDataUri}
          sx={{
            backgroundColor: '#d4a32a',
            '&:hover': { backgroundColor: '#b58924' },
          }}
        >
          Download PDF
        </Button>
        <Chip
          icon={certData.revoked ? <CancelIcon /> : <CheckCircleIcon />}
          label={certData.revoked ? 'Revoked' : 'Verified'}
          color={certData.revoked ? 'error' : 'success'}
          sx={{ fontSize: '1rem', px: 2, py: 1 }}
          onClick={() => setOpenDialog(true)}
        />
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8} className="certificate-container">
          {pdfDataUri ? (
            <iframe
              src={pdfDataUri}
              title="Certificate Preview"
              className="certificate-iframe"
            />
          ) : (
            <Box
              sx={{
                textAlign: 'center',
                p: 4,
                border: '1px solid #ccc',
                borderRadius: '5px',
              }}
            >
              <Typography variant="body1" color="textSecondary">
                {pdfError
                  ? 'Failed to generate certificate'
                  : 'Generating certificate...'}
              </Typography>
            </Box>
          )}
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Certificate Details
            </Typography>
            <Typography sx={{ mb: 1 }}>
              <strong>Name:</strong> {certData.candidateName}
            </Typography>
            <Typography sx={{ mb: 1 }}>
              <strong>Student ID:</strong> {certData.candidateId}
            </Typography>
            <Typography sx={{ mb: 1 }}>
              <strong>Certificate Date:</strong>{' '}
              {new Date(certData.creationDate).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Typography>
            <Typography sx={{ mb: 1 }}>
              <strong>Degree:</strong> {certData.degreeName}
            </Typography>
            <Typography sx={{ mb: 1 }}>
              <strong>Department:</strong> {certData.departmentName}
            </Typography>
            <Typography sx={{ mb: 1 }}>
              <strong>CGPA:</strong> {certData.cgpa}/4.00
            </Typography>
            <Typography sx={{ mb: 1 }}>
              <strong>Institute:</strong> {certData.instituteName} (
              {certData.instituteAcronym})
            </Typography>
            <Typography
              component="div"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <strong>Status:</strong>
              {certData.revoked ? (
                <Chip
                  label="Revoked"
                  color="error"
                  size="small"
                  icon={<CancelIcon />}
                />
              ) : (
                <Chip
                  label="Verified"
                  color="success"
                  size="small"
                  icon={<CheckCircleIcon />}
                />
              )}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {certData.revoked ? 'Revoked Certificate' : 'Verified Certificate'}
        </DialogTitle>
        <DialogContent>
          <Box>
            {certData.revoked ? (
              <>
                <Typography component="div" gutterBottom>
                  This certificate has been revoked due to one or more reasons:
                </Typography>
                <Box component="ul" sx={{ pl: 4, mt: 1 }}>
                  <li>Dishonest conduct detected by the institute</li>
                  <li>Credential was issued incorrectly</li>
                </Box>
              </>
            ) : (
              <>
                <Typography component="div" gutterBottom>
                  This certificate is verified and cryptographically secure.
                </Typography>
                <Box component="ul" sx={{ pl: 4, mt: 1 }}>
                  <li>Issued by a verified authority</li>
                  <li>Tamper-proof and machine verifiable</li>
                  <li>Stored on the blockchain</li>
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CertificatePage;
