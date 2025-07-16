import React, { useState, useEffect } from 'react';
import {
  Typography,
  AppBar,
  Tabs,
  Tab,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Box,
  IconButton,
  Button,
} from '@mui/material';
import FileCopyIcon from '@mui/icons-material/FileCopyOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNewOutlined';
import LoopIcon from '@mui/icons-material/LoopOutlined';
import { ethers } from 'ethers';
import InstitutionAbi from '../contracts/Institution.json';
import CertificationAbi from '../contracts/Certification.json';
import { v4 as uuidv4 } from 'uuid';
import { encrypt } from './encrypt';

const institutionAddress = import.meta.env.VITE_INSTITUTION_ADDRESS;
const certificationAddress = import.meta.env.VITE_CERTIFICATION_ADDRESS;

const InstitutePage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [form, setForm] = useState({
    name: '',
    id: '',
    degree: '',
    department: '',
    father: '',
    mother: '',
    session: '',
    cgpa: '',
  });
  const [certificateId, setCertificateId] = useState('');
  const [revokeCertificateId, setRevokeCertificateId] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [revokeSuccess, setRevokeSuccess] = useState(false);

  const [instituteName, setInstituteName] = useState('');
  const [instituteAddress, setInstituteAddress] = useState('');
  const [degrees, setDegrees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleTabChange = (_, newValue) => setTabValue(newValue);
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const fetchInstituteData = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const institution = new ethers.Contract(
        institutionAddress,
        InstitutionAbi.abi,
        signer
      );

      const [name, address, , , degreeList, departmentList] =
        await institution.getInstituteData();

      setInstituteName(name);
      setInstituteAddress(address);
      setDegrees(degreeList);
      setDepartments(departmentList);
    } catch (err) {
      console.error('Error loading institute data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const certification = new ethers.Contract(
        certificationAddress,
        CertificationAbi.abi,
        signer
      );

      const certId = uuidv4();
      const createdAt = new Date().toISOString(); // use ISO string for date

      const tx = await certification.generateCertificate(
        certId,
        form.name,
        form.id,
        form.father,
        form.mother,
        degrees.findIndex(
          d => d.degree_name === form.degree || d === form.degree
        ),
        departments.findIndex(
          d => d.department_name === form.department || d === form.department
        ),
        form.cgpa,
        form.session,
        createdAt
      );

      await tx.wait();
      setCertificateId(certId);
      setSubmitSuccess(true);
    } catch (err) {
      console.error('Error generating certificate:', err);
      alert('Certificate generation failed. Check console for details.');
    }
  };

  useEffect(() => {
    fetchInstituteData();
  }, []);

  return (
    <Grid container justifyContent="center">
      <Grid>
        <Typography variant="h4" align="center" sx={{ mt: 4 }} color="primary">
          Welcome, Institute
        </Typography>
        <Typography variant="subtitle1" align="center" sx={{ mb: 4 }}>
          You may create or revoke a certificate on the Credentials Ethereum
          Blockchain below
        </Typography>

        <Paper sx={{ p: 3, mb: 6 }}>
          <AppBar position="static" color="white">
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
            >
              <Tab
                label="Generate Certificate"
                value={0}
                sx={{
                  color: tabValue === 0 ? '#6a1b9a' : '#555',
                  backgroundColor: tabValue === 0 ? 'transparent' : '#e0e0e0',
                  textTransform: 'none',
                }}
              />
              <Tab
                label="Revoke Certificate"
                value={1}
                sx={{
                  color: tabValue === 1 ? '#6a1b9a' : '#555',
                  backgroundColor: tabValue === 1 ? 'transparent' : '#e0e0e0',
                  textTransform: 'none',
                }}
              />
            </Tabs>
          </AppBar>

          {/* Generate Certificate Form */}
          {tabValue === 0 && (
            <Box sx={{ mt: 3 }}>
              <TextField
                label="Student Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Student ID"
                name="id"
                value={form.id}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Degree</InputLabel>
                <Select
                  name="degree"
                  value={form.degree}
                  onChange={handleChange}
                >
                  {degrees.map((d, i) => (
                    <MenuItem value={d.degree_name || d} key={i}>
                      {d.degree_name || d}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Department</InputLabel>
                <Select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                >
                  {departments.map((d, i) => (
                    <MenuItem value={d.department_name || d} key={i}>
                      {d.department_name || d}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Father's Name"
                name="father"
                value={form.father}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Mother's Name"
                name="mother"
                value={form.mother}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Session"
                name="session"
                value={form.session}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
              <TextField
                label="CGPA"
                name="cgpa"
                value={form.cgpa}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mt: 3,
                  gap: 2,
                }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleGenerateCertificate}
                >
                  Submit
                </Button>
                {submitSuccess && (
                  <IconButton
                    color="primary"
                    onClick={() => setSubmitSuccess(false)}
                  >
                    <LoopIcon />
                  </IconButton>
                )}
              </Box>

              {submitSuccess && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mt: 2,
                  }}
                >
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Certificate generated with ID {certificateId}
                  </Typography>
                  <IconButton
                    onClick={() => navigator.clipboard.writeText(certificateId)}
                  >
                    <FileCopyIcon />
                  </IconButton>
                  <Button
                    variant="outlined"
                    endIcon={<OpenInNewIcon />}
                    onClick={() =>
                      window.open(`/certificate/${certificateId}`, '_blank')
                    }
                  >
                    Open
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* Revoke Certificate */}
          {tabValue === 1 && (
            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label="Certificate ID"
                value={revokeCertificateId}
                onChange={e => setRevokeCertificateId(e.target.value)}
                margin="normal"
              />
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mt: 3,
                  gap: 2,
                }}
              >
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => setRevokeSuccess(true)}
                >
                  Revoke
                </Button>
                {revokeSuccess && (
                  <IconButton
                    color="primary"
                    onClick={() => setRevokeSuccess(false)}
                  >
                    <LoopIcon />
                  </IconButton>
                )}
              </Box>
              {revokeSuccess && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mt: 2,
                  }}
                >
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Revoked Certificate with ID {revokeCertificateId}
                  </Typography>
                  <IconButton
                    onClick={() =>
                      navigator.clipboard.writeText(revokeCertificateId)
                    }
                  >
                    <FileCopyIcon />
                  </IconButton>
                  <Button
                    variant="outlined"
                    endIcon={<OpenInNewIcon />}
                    onClick={() =>
                      window.open(
                        `/certificate/${revokeCertificateId}`,
                        '_blank'
                      )
                    }
                  >
                    Open
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default InstitutePage;
