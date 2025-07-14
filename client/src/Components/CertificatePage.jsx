import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import CertificationAbi from '../contracts/Certification.json';
import { decrypt } from './decrypt';

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
import { DateRange } from '@mui/icons-material';

const certificationAddress = import.meta.env.VITE_CERTIFICATION_ADDRESS;
const salt = import.meta.env.VITE_SALT || '';

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

        setCertData({
          candidateName: decrypt(data[0], id, salt),
          courseName: data[1],
          creationDate: decrypt(data[2], id, salt),
          instituteName: data[3],
          instituteAcronym: data[4],
          instituteLink: data[5],
          revoked: data[6],
        });
        setCertExists(true);
      } catch (error) {
        console.error('Certificate not found:', error);
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
    courseName,
    creationDate,
    instituteName,
    instituteAcronym,
    instituteLink,
    revoked,
  } = certData;

  const formattedDate = new Date(parseInt(creationDate)).toLocaleDateString(
    'en-US',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );

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
              <Typography variant="h6" color="primary">
                Student Name
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {candidateName}
              </Typography>

              <Typography variant="h6" color="primary">
                Course Name
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {courseName}
              </Typography>

              <Typography variant="h6" color="primary">
                Institute
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {instituteName} ({instituteAcronym})
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                <a
                  href={instituteLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {instituteLink}
                </a>
              </Typography>

              <Typography variant="h6" color="primary">
                Issued On
              </Typography>
              <Typography variant="body1">{formattedDate}</Typography>
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
                sx={{ fontSize: '1rem', px: 2, py: 1, mb: 2 }}
                onClick={() => setOpenDialog(true)}
              />
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Dialog */}
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
