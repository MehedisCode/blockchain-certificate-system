import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import jsPDF from 'jspdf';
import CertificationAbi from '../contracts/Certification.json';
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
  const [pdfDataUri, setPdfDataUri] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  const generatePDF = (data = certData) => {
    if (!data) {
      console.error('generatePDF: No certData available');
      setError('Failed to generate certificate: No data available');
      return;
    }

    try {
      console.log('Generating PDF with certData:', data);
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // Colors
      const headerBlue = [0, 51, 102];
      const accentGold = [218, 165, 32];
      const borderGray = [80, 80, 80];

      // Border
      doc.setDrawColor(...borderGray);
      doc.setLineWidth(1.5);
      doc.rect(5, 5, 287, 200);
      doc.setDrawColor(...accentGold);
      doc.setLineWidth(0.5);
      doc.rect(7, 7, 283, 196);

      // University Info (centered)
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...headerBlue);
      doc.setFontSize(20);
      doc.text(`${data.instituteName} (${data.instituteAcronym})`, 148.5, 20, {
        align: 'center',
      });
      doc.setFontSize(12);
      doc.text(data.instituteAddress, 148.5, 30, { align: 'center' });
      doc.text(data.instituteLink, 148.5, 36, { align: 'center' });

      // Certificate Body
      doc.setFontSize(16);
      doc.text('Certificate of Graduation', 148.5, 50, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text('This is to certify that', 148.5, 60, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(data.candidateName, 148.5, 70, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(`bearing Student ID ${data.candidateId},`, 148.5, 80, {
        align: 'center',
      });
      doc.text(`son of ${data.fatherName} and ${data.motherName},`, 148.5, 88, {
        align: 'center',
      });
      doc.text(`of the Academic Session ${data.session},`, 148.5, 96, {
        align: 'center',
      });
      doc.text(
        'has successfully completed all the academic requirements and has been awarded the degree of:',
        148.5,
        104,
        { align: 'center' }
      );
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...headerBlue);
      doc.setFontSize(18);
      doc.text(`${data.degreeName} in ${data.departmentName}`, 148.5, 114, {
        align: 'center',
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(`CGPA: ${data.cgpa}/4.00`, 148.5, 124, { align: 'center' });
      doc.text('on this day,', 148.5, 132, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      const formattedDate = new Date(data.creationDate).toLocaleDateString(
        'en-US',
        {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }
      );
      doc.text(formattedDate, 148.5, 140, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.text(
        'This degree is awarded in recognition of the satisfactory completion of the prescribed course of study and all required examinations,',
        148.5,
        150,
        { align: 'center', maxWidth: 260 }
      );
      doc.text(
        'and in accordance with the rules and regulations of',
        148.5,
        158,
        { align: 'center' }
      );
      doc.setFont('helvetica', 'bold');
      doc.text(`${data.instituteName}.`, 148.5, 166, { align: 'center' });

      // Certificate ID and Revoked Status
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Certificate ID: ${id}`, 148.5, 180, { align: 'center' });

      // Signatures
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.line(50, 190, 100, 190);
      doc.text('Dr. Farhana Rahman', 75, 195, { align: 'center' });
      doc.text('Registrar', 75, 200, { align: 'center' });
      doc.text(data.instituteAcronym, 75, 205, { align: 'center' });
      doc.line(197, 190, 247, 190);
      doc.text('Prof. Kamrul Hasan', 222, 195, { align: 'center' });
      doc.text(`Head, Department of ${data.departmentName}`, 222, 200, {
        align: 'center',
      });
      doc.text(data.instituteAcronym, 222, 205, { align: 'center' });

      // Generate data URL
      const pdfDataUri = doc.output('datauristring');
      setPdfDataUri(pdfDataUri);
      setError(null); // Clear any previous errors
      console.log('PDF generated successfully');
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate certificate: ' + err.message);
    }
  };

  useEffect(() => {
    const loadCertificate = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!window.ethereum) {
          setError('Please install MetaMask!');
          alert('Please install MetaMask!');
          return;
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
        setError('Failed to fetch certificate: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    loadCertificate();
  }, [id]);

  useEffect(() => {
    if (certData && certExists) {
      console.log('Triggering generatePDF with certData:', certData);
      generatePDF(certData);
    }
  }, [certData, certExists]);

  const downloadPDF = () => {
    if (pdfDataUri) {
      const link = document.createElement('a');
      link.href = pdfDataUri;
      link.download = `${certData?.candidateName || 'Certificate'}_Certificate.pdf`;
      link.click();
    } else {
      console.error('Download PDF: No pdfDataUri available');
      setError('No certificate available to download');
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
        {error && (
          <Typography variant="body1" color="error" sx={{ mt: 2 }}>
            {error}
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
      {error && (
        <Typography variant="body1" color="error" align="center" sx={{ mb: 2 }}>
          {error}
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
                {error
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
