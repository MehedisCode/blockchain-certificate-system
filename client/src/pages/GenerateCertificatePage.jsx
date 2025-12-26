import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import * as XLSX from 'xlsx-js-style';
import InstitutionAbi from '../contracts/Institution.json';
import CertificationAbi from '../contracts/Certification.json';

const institutionAddress = import.meta.env.VITE_INSTITUTION_CONTRACT_ADDRESS;
const certificationAddress = import.meta.env.VITE_CERTIFICATION_ADDRESS;

const GenerateCertificatePage = ({ userAddress }) => {
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
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [instituteName, setInstituteName] = useState('');
  const [instituteAddress, setInstituteAddress] = useState('');
  const [degrees, setDegrees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [fileError, setFileError] = useState(null);

  const [certificateHistory, setCertificateHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Search states for history
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [appliedSearch, setAppliedSearch] = useState({
    term: '',
    field: 'all',
  });

  const fileInputRef = useRef(null);

  const handleTabChange = (_, newValue) => setTabValue(newValue);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === 'id' && students.length > 0) {
      const student = students.find(
        s => String(s['Student ID']).trim() === String(value).trim()
      );
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

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setFileError('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!jsonData.length) {
          setFileError('Excel file appears to be empty');
          return;
        }

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
        });
      } catch (err) {
        console.error('Error parsing Excel file:', err);
        setFileError('Failed to parse Excel file');
        setStudents([]);
      }
    };
    reader.readAsBinaryString(file);
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
      if (!window.ethereum) {
        setFileError('MetaMask is not installed');
        return;
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });

      if (!form.name || !form.id || !form.degree || !form.department) {
        setFileError('Please fill in all required fields before generating.');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const instituteAddress = (await signer.getAddress()).toLowerCase();

      // Check if the student already has a certificate
      const response = await fetch(
        `http://localhost:3000/api/certificates?instituteAddress=${instituteAddress}&studentId=${form.id}`
      );

      const data = await response.json();
      if (response.status === 400 && data.error) {
        setFileError(data.error); // Show the error message if certificate exists
        return;
      }

      // First, save certificate to MongoDB (before blockchain interaction)
      const certId = uuidv4();
      const createdAt = new Date().toISOString();

      const certificateData = {
        certId,
        instituteAddress,
        name: form.name,
        studentId: form.id,
        father: form.father,
        mother: form.mother,
        degree: form.degree,
        department: form.department,
        cgpa: form.cgpa,
        session: form.session,
        createdAt,
      };

      const postResponse = await fetch(
        'http://localhost:3000/api/certificates',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(certificateData),
        }
      );

      if (!postResponse.ok)
        throw new Error('Failed to save certificate to MongoDB');

      const postData = await postResponse.json();
      console.log('Certificate saved to history:', postData.certificate);

      // Now, generate certificate on the blockchain
      const certification = new ethers.Contract(
        certificationAddress,
        CertificationAbi.abi,
        signer
      );

      const degreeIndex = degrees.findIndex(
        d => d.degree_name === form.degree || d === form.degree
      );
      const deptIndex = departments.findIndex(
        d => d.department_name === form.department || d === form.department
      );

      if (degreeIndex < 0 || deptIndex < 0) {
        setFileError('Invalid Degree or Department selection');
        return;
      }

      const tx = await certification.generateCertificate(
        certId,
        form.name,
        form.id,
        form.father,
        form.mother,
        degreeIndex,
        deptIndex,
        form.cgpa,
        form.session,
        createdAt
      );

      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      console.log('Transaction confirmed!');

      setCertificateId(certId);
      setSubmitSuccess(true);
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
      });
    } catch (err) {
      console.error('Error generating certificate:', err);
      setFileError(
        'Certificate generation failed: ' + (err.reason || err.message)
      );
    }
  };

  const fetchCertificateHistory = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const instituteAddress = (await signer.getAddress()).toLowerCase();

      const response = await fetch(
        `http://localhost:3000/api/certificates?instituteAddress=${instituteAddress}`
      );

      if (!response.ok) throw new Error('Failed to fetch certificate history');

      const history = await response.json();
      setCertificateHistory(history);
    } catch (err) {
      console.error('Error fetching certificate history:', err);
      setFileError('Failed to fetch certificate history');
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current.click();
  };

  // Apply search button click
  const handleSearch = () => {
    setAppliedSearch({ term: searchTerm.trim(), field: searchField });
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchField('all');
    setAppliedSearch({ term: '', field: 'all' });
  };

  // Filtered history based on applied search
  const filteredHistory = useMemo(() => {
    const term = (appliedSearch.term || '').toLowerCase();
    const field = appliedSearch.field;

    if (!term) return certificateHistory;

    const match = val =>
      String(val ?? '')
        .toLowerCase()
        .includes(term);

    return certificateHistory.filter(c => {
      if (field === 'certId') return match(c.certId);
      if (field === 'studentId') return match(c.studentId);
      if (field === 'name') return match(c.name);
      if (field === 'degree') return match(c.degree);
      if (field === 'department') return match(c.department);

      // all
      return (
        match(c.certId) ||
        match(c.studentId) ||
        match(c.name) ||
        match(c.degree) ||
        match(c.department) ||
        match(c.createdAt)
      );
    });
  }, [certificateHistory, appliedSearch]);

  useEffect(() => {
    if (window.ethereum) {
      setTimeout(() => {
        fetchInstituteData();
      }, 300);
    }
  }, []);

  useEffect(() => {
    if (tabValue === 1) {
      fetchCertificateHistory();
      // reset applied search when entering history tab (optional)
      // setAppliedSearch({ term: '', field: 'all' });
    }
  }, [tabValue]);

  return (
    <Grid container justifyContent="center">
      <Grid item xs={12}>
        <Typography variant="h4" align="center" sx={{ mt: 4 }} color="primary">
          Welcome, <b>{instituteName}</b>
        </Typography>
        <Typography variant="subtitle1" align="center" sx={{ mb: 4 }}>
          You may create a certificate on the Credentials Ethereum Blockchain
          below
        </Typography>

        <Paper sx={{ p: 3, mb: 6 }}>
          <AppBar position="static" color="white">
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
            >
              <Tab label="Generate Certificate" value={0} />
              <Tab label="Certificate History" value={1} />
            </Tabs>
          </AppBar>

          {/* TAB 0: Generate */}
          {tabValue === 0 && (
            <Box sx={{ mt: 3 }}>
              <div className="container">
                <div className="section certificate-details">
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
                </div>

                <div className="section from-excel">
                  <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                    <Typography gutterBottom sx={{ mb: 2 }}>
                      From Excel File:
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
                      Enter Student ID to extract details from uploaded excel
                    </Typography>

                    <TextField
                      label="Student ID"
                      name="id"
                      value={form.id}
                      onChange={handleChange}
                      fullWidth
                      margin="normal"
                      helperText="Enter ID to auto-fill from uploaded Excel"
                    />
                  </Paper>
                </div>
              </div>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mt: 4,
                  gap: 2,
                }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGenerateCertificate}
                >
                  Generate Certificate
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
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                  <Alert severity="success">
                    Certificate generated successfully!
                    <br />
                    ID: <strong>{certificateId}</strong>
                    <IconButton
                      size="small"
                      onClick={() =>
                        navigator.clipboard.writeText(certificateId)
                      }
                    >
                      <FileCopyIcon fontSize="small" />
                    </IconButton>
                    <Button
                      size="small"
                      variant="outlined"
                      endIcon={<OpenInNewIcon />}
                      onClick={() =>
                        window.open(`/certificate/${certificateId}`, '_blank')
                      }
                      sx={{ ml: 1 }}
                    >
                      View Certificate
                    </Button>
                  </Alert>
                </Box>
              )}
            </Box>
          )}

          {/* TAB 1: Certificate History */}
          {tabValue === 1 && (
            <Box sx={{ mt: 3 }}>
              {/* Search bar */}
              <Paper elevation={2} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Search By</InputLabel>
                      <Select
                        value={searchField}
                        label="Search By"
                        onChange={e => setSearchField(e.target.value)}
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="certId">Certificate ID</MenuItem>
                        <MenuItem value="studentId">Student ID</MenuItem>
                        <MenuItem value="name">Name</MenuItem>
                        <MenuItem value="degree">Degree</MenuItem>
                        <MenuItem value="department">Department</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Search"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      fullWidth
                      placeholder="Type keyword (e.g., certId, studentId, name...)"
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleSearch}
                      >
                        Search
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleClearSearch}
                      >
                        Clear
                      </Button>
                    </Box>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" color="text.secondary">
                    Showing: <b>{filteredHistory.length}</b> result(s)
                  </Typography>
                  {appliedSearch.term ? (
                    <Typography variant="caption" color="text.secondary">
                      Filter: <b>{appliedSearch.field}</b> contains "
                      <b>{appliedSearch.term}</b>"
                    </Typography>
                  ) : null}
                </Box>
              </Paper>

              {/* Errors */}
              {fileError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {fileError}
                </Alert>
              )}

              {/* List */}
              {historyLoading ? (
                <Typography>Loading history...</Typography>
              ) : (
                <Grid container spacing={2}>
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((certificate, index) => (
                      <Grid item xs={12} md={6} key={certificate._id || index}>
                        <Paper sx={{ p: 3 }}>
                          <Typography variant="body1">
                            Certificate ID: {certificate.certId}
                          </Typography>
                          <Typography variant="body2">
                            Student ID: {certificate.studentId}
                          </Typography>
                          <Typography variant="body2">
                            Name: {certificate.name}
                          </Typography>
                          <Typography variant="body2">
                            Degree: {certificate.degree}
                          </Typography>
                          <Typography variant="body2">
                            Department: {certificate.department}
                          </Typography>
                          <Typography variant="body2">
                            Date: {certificate.createdAt}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary">
                        No certificates found.
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              )}
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default GenerateCertificatePage;
