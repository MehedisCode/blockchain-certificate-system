import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import CertificationAbi from '../contracts/Certification.json';

import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
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

const certificationAddress = import.meta.env.VITE_CERTIFICATION_ADDRESS;

const CertificatePage = () => {
  const { id } = useParams();
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [certExists, setCertExists] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  useEffect(() => {
    const loadCertificate = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(
          certificationAddress,
          CertificationAbi.abi,
          provider
        );
        const data = await contract.getData(id);

        // data array structure assumed:
        // [candidateName, candidateId, fatherName, motherName,
        // degreeName, departmentName, cgpa, session,
        // creationDate, instituteName, instituteAcronym, instituteLink, revoked]

        setCertData({
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
          instituteAcronym: data[10],
          instituteLink: data[11],
          revoked: data[12],
        });
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

  if (loading)
    return (
      <Typography align="center" sx={{ mt: 6 }}>
        Loading Certificate...
      </Typography>
    );

  if (!certExists)
    return (
      <Typography color="error" align="center" sx={{ mt: 6 }}>
        Certificate with ID "{id}" not found.
      </Typography>
    );

  const {
    candidateName,
    candidateId,
    fatherName,
    motherName,
    degreeName,
    departmentName,
    cgpa,
    session,
    creationDate,
    instituteName,
    instituteAcronym,
    instituteLink,
    revoked,
  } = certData;

  const formattedDate = new Date(creationDate).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Box sx={{ p: 4, maxWidth: 1000, mx: 'auto' }}>
      <Paper elevation={4} sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <Box
          sx={{ background: 'linear-gradient(120deg, #363e98, #8ac6ff)', p: 3 }}
        >
          <Typography variant="h4" color="white" fontWeight="bold">
            Blockchain Credential Certificate
          </Typography>
        </Box>

        <Box sx={{ p: 4 }}>
          <Grid
            container
            spacing={3}
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <Grid item xs={12} sm={8}>
              <Typography variant="h6" color="primary" gutterBottom>
                Student Details
              </Typography>
              <Typography>
                <strong>Name:</strong> {candidateName}
              </Typography>
              <Typography>
                <strong>ID:</strong> {candidateId}
              </Typography>
              <Typography>
                <strong>Father's Name:</strong> {fatherName}
              </Typography>
              <Typography>
                <strong>Mother's Name:</strong> {motherName}
              </Typography>
              <Typography
                sx={{ mt: 2 }}
                variant="h6"
                color="primary"
                gutterBottom
              >
                Academic Details
              </Typography>
              <Typography>
                <strong>Degree:</strong> {degreeName}
              </Typography>
              <Typography>
                <strong>Department:</strong> {departmentName}
              </Typography>
              <Typography>
                <strong>CGPA:</strong> {cgpa}
              </Typography>
              <Typography>
                <strong>Session:</strong> {session}
              </Typography>
              <Typography
                sx={{ mt: 2 }}
                variant="h6"
                color="primary"
                gutterBottom
              >
                Institute Details
              </Typography>
              <Typography>
                {instituteName} ({instituteAcronym})
              </Typography>
              <Typography>
                <a
                  href={instituteLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {instituteLink}
                </a>
              </Typography>
              <Typography
                sx={{ mt: 2 }}
                variant="h6"
                color="primary"
                gutterBottom
              >
                Issued On
              </Typography>
              <Typography>{formattedDate}</Typography>
            </Grid>

            <Grid
              item
              xs={12}
              sm="auto"
              sx={{ textAlign: { xs: 'left', sm: 'right' } }}
            >
              <Chip
                icon={revoked ? <CancelIcon /> : <CheckCircleIcon />}
                label={revoked ? 'Revoked' : 'Verified'}
                color={revoked ? 'error' : 'success'}
                sx={{
                  fontSize: '1rem',
                  px: 2,
                  py: 1,
                  mb: 2,
                  cursor: 'pointer',
                }}
                onClick={() => setOpenDialog(true)}
              />
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {revoked ? 'Revoked Certificate' : 'Verified Certificate'}
        </DialogTitle>
        <DialogContent>
          {revoked ? (
            <>
              <Typography gutterBottom>
                This certificate has been revoked due to one or more reasons:
              </Typography>
              <ul>
                <li>Dishonest conduct detected by the institute</li>
                <li>Credential was issued incorrectly</li>
              </ul>
            </>
          ) : (
            <>
              <Typography gutterBottom>
                This certificate is verified and cryptographically secure.
              </Typography>
              <ul>
                <li>Issued by a verified authority</li>
                <li>Tamper-proof and machine verifiable</li>
                <li>Stored on the blockchain</li>
              </ul>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CertificatePage;
