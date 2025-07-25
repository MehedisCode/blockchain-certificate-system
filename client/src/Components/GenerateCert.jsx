import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
} from '@mui/material';
import FileCopyIcon from '@mui/icons-material/FileCopyOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNewOutlined';
import LoopIcon from '@mui/icons-material/LoopOutlined';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import InstitutionAbi from '../contracts/Institution.json';
import CertificationAbi from '../contracts/Certification.json';

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
  const [students, setStudents] = useState([]);
  const [fileError, setFileError] = useState(null);
  const fileInputRef = useRef(null);

  const handleTabChange = (_, newValue) => setTabValue(newValue);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Auto-fill form when Student ID changes
    if (name === 'id' && students.length > 0) {
      const student = students.find(s => s['Student ID'] === value);
      if (student) {
        setForm({
          id: value,
          name: student['Name'] || '',
          father: student["Father's Name"] || '',
          mother: student["Mother's Name"] || '',
          degree: student['Degree'] || '',
          department: student['Department'] || '',
          session: student['Session'] || '',
          cgpa: student['CGPA'] || '',
        });
        setFileError(null);
      } else {
        setFileError('No student found with this ID');
      }
    }
  };

  const handleFileUpload = e => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setFileError('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate required headers
        const requiredHeaders = [
          'Student ID',
          'Name',
          "Father's Name",
          "Mother's Name",
          'Degree',
          'Department',
          'Session',
          'CGPA',
        ];
        const headers = Object.keys(jsonData[0] || {});
        const missingHeaders = requiredHeaders.filter(
          h => !headers.includes(h)
        );
        if (missingHeaders.length > 0) {
          setFileError(
            `Missing required columns: ${missingHeaders.join(', ')}`
          );
          setStudents([]);
          return;
        }

        // Validate Degree and Department against blockchain data
        const invalidEntries = jsonData.filter(
          row =>
            !degrees.includes(row['Degree']) &&
            !degrees.some(d => d.degree_name === row['Degree']) &&
            !departments.includes(row['Department']) &&
            !departments.some(d => d.department_name === row['Department'])
        );
        if (invalidEntries.length > 0) {
          setFileError('Some rows contain invalid Degree or Department values');
          setStudents([]);
          return;
        }

        const formattedData = jsonData.map(row => ({
          ...row,
          CGPA: String(row['CGPA'] || ''),
        }));

        setStudents(formattedData);
        setFileError(null);
        setForm({
          name: '',
          id: '',
          degree: '',
          department: '',
          father: '',
          mother: '',
          session: '',
          cgpa: '',
        }); // Reset form after new file upload
      } catch (err) {
        console.error('Error parsing Excel file:', err);
        setFileError('Failed to parse Excel file');
        setStudents([]);
      }
    };
    reader.readAsArrayBuffer(file);
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
      setFileError('Failed to fetch institute data');
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
      const createdAt = new Date().toISOString();

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
      setForm({
        name: '',
        id: '',
        degree: '',
        department: '',
        father: '',
        mother: '',
        session: '',
        cgpa: '',
      }); // Reset form after submission
    } catch (err) {
      console.error('Error generating certificate:', err);
      setFileError('Certificate generation failed: ' + err.message);
    }
  };

  const handleRevokeCertificate = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const certification = new ethers.Contract(
        certificationAddress,
        CertificationAbi.abi,
        signer
      );

      const tx = await certification.revokeCertificate(revokeCertificateId);
      await tx.wait();
      setRevokeSuccess(true);
    } catch (err) {
      console.error('Error revoking certificate:', err);
      setFileError('Certificate revocation failed: ' + err.message);
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current.click();
  };

  useEffect(() => {
    if (window.ethereum) {
      setTimeout(() => {
        fetchInstituteData();
      }, 300); // Wait for MetaMask to be ready
    }
  }, []);

  return (
    <Grid container justifyContent="center">
      <Grid item xs={12}>
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
              <Grid container alignItems="flex-start" spacing={2}>
                {/* Left Column: Input Fields */}
                <Grid item xs={12} md={6} sx={{ width: '1024px' }}>
                  <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Certificate Details
                    </Typography>
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
                  </Paper>
                </Grid>
                {/* Right Column: File Upload and Student ID */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                    <Typography gutterBottom sx={{ mb: 2 }}>
                      From Excel File :
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<UploadFileIcon />}
                        onClick={handleFileButtonClick}
                        fullWidth
                      >
                        Choose Excel File
                      </Button>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                      />
                      {fileError && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {fileError}
                        </Alert>
                      )}
                    </Box>
                    <Typography sx={{ fontSize: '12px' }} gutterBottom>
                      Enter Student ID to extract details from excel file
                    </Typography>
                    <TextField
                      label="Student ID"
                      name="id"
                      value={form.id}
                      onChange={handleChange}
                      fullWidth
                      margin="normal"
                      helperText="Enter ID to auto-fill from uploaded Excel"
                      sx={{ mt: '0' }}
                    />
                  </Paper>
                </Grid>
              </Grid>
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
                  onClick={handleRevokeCertificate}
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
              {fileError && (
                <Typography
                  variant="body2"
                  color="error"
                  sx={{ mt: 2, textAlign: 'center' }}
                >
                  {fileError}
                </Typography>
              )}
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default InstitutePage;
