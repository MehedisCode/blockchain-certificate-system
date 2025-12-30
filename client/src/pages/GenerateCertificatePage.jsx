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
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Chip,
  Divider,
  Snackbar,
  Container,
  Card,
  CardContent,
  CardHeader,
  OutlinedInput,
  InputAdornment,
  Tooltip,
  Fade,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CardActions,
} from '@mui/material';
import {
  FileCopy as FileCopyIcon,
  OpenInNew as OpenInNewIcon,
  Refresh as RefreshIcon,
  UploadFile as UploadFileIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  DateRange as DateRangeIcon,
  InsertDriveFile as FileIcon,
  History as HistoryIcon,
  AddCircle as AddCircleIcon,
} from '@mui/icons-material';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx-js-style';
import InstitutionAbi from '../contracts/Institution.json';
import CertificationAbi from '../contracts/Certification.json';
import { IPFSService } from '../utils/ipfsService';

const institutionAddress = import.meta.env.VITE_INSTITUTION_CONTRACT_ADDRESS;
const certificationAddress = import.meta.env.VITE_CERTIFICATION_ADDRESS;

const steps = ['Certificate Details', 'Upload Document', 'Review & Generate'];

const GenerateCertificatePage = ({ userAddress }) => {
  const [tabValue, setTabValue] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form states
  const [form, setForm] = useState({
    name: '',
    id: '',
    degree: '',
    department: '',
    father: '',
    mother: '',
    session: '',
    cgpa: '',
    creationDate: new Date().toISOString().split('T')[0],
  });

  // File states
  const [certificateFile, setCertificateFile] = useState(null);
  const [ipfsResult, setIpfsResult] = useState(null);

  // Institute data
  const [instituteName, setInstituteName] = useState('');
  const [instituteAddress, setInstituteAddress] = useState('');
  const [degrees, setDegrees] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Student data from Excel
  const [students, setStudents] = useState([]);

  // Results
  const [certificateId, setCertificateId] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // History
  const [certificateHistory, setCertificateHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [appliedSearch, setAppliedSearch] = useState({
    term: '',
    field: 'all',
  });

  const fileInputRef = useRef(null);
  const certificateFileRef = useRef(null);

  const handleTabChange = (_, newValue) => setTabValue(newValue);
  const handleNext = () =>
    setActiveStep(prev => Math.min(prev + 1, steps.length - 1));
  const handleBack = () => setActiveStep(prev => Math.max(prev - 1, 0));

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
          creationDate: form.creationDate,
        });
        setError(null);
      } else {
        setError('No student found with this ID');
      }
    }
  };

  const handleExcelFileUpload = e => {
    const file = e.target.files[0];
    if (!file) return;

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setError('Please upload a valid Excel file (.xlsx or .xls)');
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
          setError('Excel file appears to be empty');
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
          setError(`Missing required columns: ${missingHeaders.join(', ')}`);
          setStudents([]);
          return;
        }

        const formattedData = jsonData.map(row => ({
          ...row,
          CGPA: String(row['CGPA'] || ''),
        }));

        setStudents(formattedData);
        setError(null);
      } catch (err) {
        console.error('Error parsing Excel file:', err);
        setError('Failed to parse Excel file');
        setStudents([]);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleCertificateFileUpload = e => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = IPFSService.validateFile(file);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }

    setCertificateFile(file);
    setError(null);
  };

  const uploadToIPFS = async () => {
    if (!certificateFile) {
      setError('Please select a certificate file to upload');
      return false;
    }

    setUploading(true);
    try {
      const result = await IPFSService.uploadToPinata(certificateFile, {
        studentId: form.id,
        studentName: form.name,
        institute: instituteName,
      });

      if (!result.success) {
        throw new Error(result.error || 'IPFS upload failed');
      }

      setIpfsResult(result);
      setSuccessMessage(
        `File uploaded to IPFS! Hash: ${result.ipfsHash.slice(0, 20)}...`
      );
      return result.ipfsHash;
    } catch (error) {
      setError(`IPFS Upload Failed: ${error.message}`);
      return false;
    } finally {
      setUploading(false);
    }
  };

  const fetchInstituteData = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const instituteWalletAddress = await signer.getAddress();
      const institution = new ethers.Contract(
        institutionAddress,
        InstitutionAbi.abi,
        signer
      );

      const [name, addrLine, acr, website, degs, depts] =
        await institution.getInstituteDetailedInfo(instituteWalletAddress);

      setInstituteName(name);
      setInstituteAddress(addrLine);
      setDegrees(degs);
      setDepartments(depts);
    } catch (err) {
      console.error('Error loading institute data:', err);
      setError('Failed to fetch institute data');
    } finally {
      setLoading(false);
    }
  };

  const generateCertificate = async (ipfsHash = '') => {
    try {
      if (!window.ethereum) {
        setError('MetaMask is not installed');
        return false;
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });

      if (!form.name || !form.id || !form.degree || !form.department) {
        setError('Please fill in all required fields');
        return false;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const instituteWalletAddress = (await signer.getAddress()).toLowerCase();

      const response = await fetch(
        `http://localhost:3000/api/certificates?instituteAddress=${instituteWalletAddress}&studentId=${form.id}`
      );
      const data = await response.json();
      if (response.status === 400 && data.error) {
        setError(data.error);
        return false;
      }

      const certId = uuidv4();

      const certificateData = {
        certId,
        instituteAddress: instituteWalletAddress,
        name: form.name,
        studentId: form.id,
        father: form.father,
        mother: form.mother,
        degree: form.degree,
        department: form.department,
        cgpa: form.cgpa,
        session: form.session,
        createdAt: form.creationDate,
        ipfsHash: ipfsHash || '',
      };

      const postResponse = await fetch(
        'http://localhost:3000/api/certificates',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(certificateData),
        }
      );

      if (!postResponse.ok) {
        throw new Error('Failed to save certificate to MongoDB');
      }

      const certification = new ethers.Contract(
        certificationAddress,
        CertificationAbi.abi,
        signer
      );

      const degreeIndex = degrees.findIndex(d => d === form.degree);
      const deptIndex = departments.findIndex(d => d === form.department);

      if (degreeIndex < 0 || deptIndex < 0) {
        setError('Invalid Degree or Department selection');
        return false;
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
        form.creationDate,
        ipfsHash || ''
      );

      console.log('Transaction sent:', tx.hash);
      setTransactionHash(tx.hash);

      const receipt = await tx.wait();
      console.log('Transaction confirmed!');

      setCertificateId(certId);
      setSuccessMessage(
        `Certificate generated successfully! Transaction: ${tx.hash.slice(0, 20)}...`
      );

      return true;
    } catch (err) {
      console.error('Error generating certificate:', err);
      setError(`Certificate generation failed: ${err.reason || err.message}`);
      return false;
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);

    try {
      let ipfsHash = '';

      if (certificateFile) {
        ipfsHash = await uploadToIPFS();
        if (!ipfsHash) {
          setGenerating(false);
          return;
        }
      }

      const success = await generateCertificate(ipfsHash);

      if (success) {
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
          creationDate: new Date().toISOString().split('T')[0],
        });
        setCertificateFile(null);
        setIpfsResult(null);
        setActiveStep(0);
      }
    } catch (error) {
      console.error('Error in handleGenerate:', error);
      setError(`Process failed: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const fetchCertificateHistory = async () => {
    try {
      setHistoryLoading(true);
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
      setError('Failed to fetch certificate history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleCertificateFileButtonClick = () => {
    certificateFileRef.current.click();
  };

  const handleSearch = () => {
    setAppliedSearch({ term: searchTerm.trim(), field: searchField });
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchField('all');
    setAppliedSearch({ term: '', field: 'all' });
  };

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
    }
  }, [tabValue]);

  // Step 1: Certificate Details - REDESIGNED
  const renderStep1 = () => (
    <Card elevation={3} sx={{ mb: 3, borderRadius: 2 }}>
      <CardHeader
        title={
          <Typography variant="h5" color="primary">
            Certificate Details
          </Typography>
        }
        subheader="Fill in the student and academic information"
        avatar={<PersonIcon color="primary" />}
      />
      <Divider />
      <CardContent>
        <Accordion defaultExpanded sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography
              variant="subtitle1"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <PersonIcon fontSize="small" />
              Personal Information
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Student Name *"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  fullWidth
                  required
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Enter the full name of the student"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Student ID *"
                  name="id"
                  value={form.id}
                  onChange={handleChange}
                  fullWidth
                  required
                  variant="outlined"
                  helperText="Unique student identifier"
                  InputProps={{
                    endAdornment: students.length > 0 && (
                      <InputAdornment position="end">
                        <Tooltip
                          title={`${students.length} student records loaded`}
                        >
                          <Chip
                            label={`${students.length} records`}
                            size="small"
                            color="info"
                          />
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Father's Name"
                  name="father"
                  value={form.father}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  helperText="Optional"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Mother's Name"
                  name="mother"
                  value={form.mother}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  helperText="Optional"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography
              variant="subtitle1"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <SchoolIcon fontSize="small" />
              Academic Information
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {/* IMPROVED DEGREE DROPDOWN */}
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Degree *</InputLabel>
                  <Select
                    name="degree"
                    value={form.degree}
                    onChange={handleChange}
                    label="Degree *"
                    variant="outlined"
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                          width: '100%',
                        },
                      },
                    }}
                    renderValue={selected => (
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <SchoolIcon fontSize="small" color="action" />
                        <Typography noWrap>
                          {selected || 'Select a degree'}
                        </Typography>
                        {selected && (
                          <Chip
                            label={`${degrees.length} available`}
                            size="small"
                            variant="outlined"
                            sx={{ ml: 'auto' }}
                          />
                        )}
                      </Box>
                    )}
                  >
                    {degrees.length === 0 ? (
                      <MenuItem disabled>No degrees available</MenuItem>
                    ) : (
                      degrees.map((degree, index) => (
                        <MenuItem
                          key={index}
                          value={degree}
                          sx={{
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            minHeight: 'auto',
                            py: 1.5,
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              width: '100%',
                            }}
                          >
                            <SchoolIcon fontSize="small" color="action" />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2">{degree}</Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Degree #{index + 1}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    {form.degree
                      ? `Selected: ${form.degree}`
                      : 'Choose from available degrees'}
                  </Typography>
                </FormControl>
              </Grid>

              {/* IMPROVED DEPARTMENT DROPDOWN */}
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Department *</InputLabel>
                  <Select
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    label="Department *"
                    variant="outlined"
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                          width: '100%',
                        },
                      },
                    }}
                    renderValue={selected => (
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <SchoolIcon fontSize="small" color="action" />
                        <Typography noWrap>
                          {selected || 'Select a department'}
                        </Typography>
                        {selected && (
                          <Chip
                            label={`${departments.length} available`}
                            size="small"
                            variant="outlined"
                            sx={{ ml: 'auto' }}
                          />
                        )}
                      </Box>
                    )}
                  >
                    {departments.length === 0 ? (
                      <MenuItem disabled>No departments available</MenuItem>
                    ) : (
                      departments.map((dept, index) => (
                        <MenuItem
                          key={index}
                          value={dept}
                          sx={{
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            minHeight: 'auto',
                            py: 1.5,
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              width: '100%',
                            }}
                          >
                            <SchoolIcon fontSize="small" color="action" />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2">{dept}</Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Department #{index + 1}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    {form.department
                      ? `Selected: ${form.department}`
                      : 'Choose from available departments'}
                  </Typography>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Session *"
                  name="session"
                  value={form.session}
                  onChange={handleChange}
                  fullWidth
                  required
                  variant="outlined"
                  placeholder="e.g., 2023-2024"
                  helperText="Academic session or year"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="CGPA *"
                  name="cgpa"
                  value={form.cgpa}
                  onChange={handleChange}
                  fullWidth
                  required
                  type="number"
                  variant="outlined"
                  inputProps={{ step: 0.01, min: 0, max: 4 }}
                  helperText="0.00 - 4.00 scale"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Issue Date *"
                  name="creationDate"
                  type="date"
                  value={form.creationDate}
                  onChange={handleChange}
                  fullWidth
                  required
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DateRangeIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Date of certificate issuance"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Excel Upload Section */}
        <Card variant="outlined" sx={{ mt: 3 }}>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <UploadFileIcon color="primary" />
              Import Student Data (Optional)
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Upload Excel file to auto-populate student details when entering
              Student ID
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<UploadFileIcon />}
                onClick={handleFileButtonClick}
                fullWidth
                sx={{ py: 1.5 }}
              >
                Upload Excel File
              </Button>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelFileUpload}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
            </Box>
            {students.length > 0 && (
              <Alert
                severity="success"
                icon={<CheckCircleIcon />}
                sx={{ mb: 2 }}
              >
                <Typography variant="body2">
                  <strong>{students.length} student records</strong> loaded
                  successfully. Enter Student ID to auto-fill details.
                </Typography>
              </Alert>
            )}
            <Alert severity="info" variant="outlined">
              <Typography variant="caption">
                Required Excel columns: Student ID, Name, Father's Name,
                Mother's Name, Degree, Department, Session, CGPA
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );

  // Step 2: Upload Document
  const renderStep2 = () => (
    <Card elevation={3} sx={{ mb: 3, borderRadius: 2 }}>
      <CardHeader
        title={
          <Typography variant="h5" color="primary">
            Upload Certificate Document
          </Typography>
        }
        subheader="Optional: Upload PDF or image to IPFS for permanent storage"
        avatar={<FileIcon color="primary" />}
      />
      <Divider />
      <CardContent>
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Box
            sx={{
              border: '3px dashed',
              borderColor: certificateFile ? 'success.main' : 'primary.main',
              borderRadius: 3,
              p: 5,
              bgcolor: certificateFile ? 'success.50' : 'primary.50',
              cursor: 'pointer',
              transition: 'all 0.3s',
              '&:hover': {
                bgcolor: certificateFile ? 'success.100' : 'primary.100',
                borderColor: certificateFile ? 'success.dark' : 'primary.dark',
                transform: 'translateY(-2px)',
              },
            }}
            onClick={handleCertificateFileButtonClick}
          >
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={handleCertificateFileUpload}
              ref={certificateFileRef}
              style={{ display: 'none' }}
            />

            {uploading ? (
              <Box>
                <CircularProgress size={60} />
                <Typography variant="h6" sx={{ mt: 3 }}>
                  Uploading to IPFS...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Please wait while we upload your file
                </Typography>
              </Box>
            ) : certificateFile ? (
              <Fade in={true}>
                <Box>
                  <CheckCircleIcon
                    sx={{ fontSize: 80, color: 'success.main', mb: 2 }}
                  />
                  <Typography variant="h5" gutterBottom>
                    ✓ File Ready
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {certificateFile.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {IPFSService.formatFileSize(certificateFile.size)}
                  </Typography>
                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={e => {
                        e.stopPropagation();
                        setCertificateFile(null);
                        setIpfsResult(null);
                      }}
                      sx={{ mr: 2 }}
                    >
                      Change File
                    </Button>
                    <Button
                      variant="contained"
                      onClick={async e => {
                        e.stopPropagation();
                        await uploadToIPFS();
                      }}
                    >
                      Upload to IPFS
                    </Button>
                  </Box>
                </Box>
              </Fade>
            ) : (
              <Box>
                <CloudUploadIcon
                  sx={{ fontSize: 80, color: 'primary.main', mb: 2 }}
                />
                <Typography variant="h5" gutterBottom>
                  Drag & Drop or Click to Upload
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Supports PDF, PNG, JPG, JPEG, WEBP
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Maximum file size: 10MB
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {ipfsResult && (
          <Card variant="outlined" sx={{ mt: 3, bgcolor: 'info.50' }}>
            <CardContent>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
              >
                <CheckCircleIcon color="success" />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6">✓ Uploaded to IPFS</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your file is now stored on the decentralized IPFS network
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    IPFS Hash:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        wordBreak: 'break-all',
                        fontFamily: 'monospace',
                        bgcolor: 'grey.100',
                        p: 1,
                        borderRadius: 1,
                        flex: 1,
                      }}
                    >
                      {ipfsResult.ipfsHash}
                    </Typography>
                    <Tooltip title="Copy">
                      <IconButton
                        size="small"
                        onClick={() =>
                          navigator.clipboard.writeText(ipfsResult.ipfsHash)
                        }
                      >
                        <FileCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Public URL:
                  </Typography>
                  <Button
                    fullWidth
                    variant="outlined"
                    href={ipfsResult.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    endIcon={<OpenInNewIcon />}
                  >
                    View on IPFS
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Why upload to IPFS?</strong>
            <br />
            • Permanent, decentralized storage
            <br />
            • File hash stored on blockchain for verification
            <br />
            • Anyone can verify the certificate authenticity
            <br />• Optional but recommended for enhanced security
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );

  // Step 3: Review & Generate
  const renderStep3 = () => (
    <Card elevation={3} sx={{ mb: 3, borderRadius: 2 }}>
      <CardHeader
        title={
          <Typography variant="h5" color="primary">
            Review & Generate
          </Typography>
        }
        subheader="Verify all information before generating certificate"
        avatar={<CheckCircleIcon color="primary" />}
      />
      <Divider />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardHeader
                title="Student Information"
                titleTypographyProps={{ variant: 'subtitle1' }}
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Full Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {form.name || 'Not provided'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Student ID
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {form.id || 'Not provided'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Parents
                    </Typography>
                    <Typography variant="body1">
                      Father: {form.father || 'Not provided'}
                      <br />
                      Mother: {form.mother || 'Not provided'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardHeader
                title="Academic Information"
                titleTypographyProps={{ variant: 'subtitle1' }}
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Degree
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SchoolIcon fontSize="small" color="action" />
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {form.degree || 'Not selected'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Department
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SchoolIcon fontSize="small" color="action" />
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {form.department || 'Not selected'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Session & CGPA
                    </Typography>
                    <Typography variant="body1">
                      Session: {form.session || 'Not provided'}
                      <br />
                      CGPA: {form.cgpa || 'Not provided'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Issue Date
                    </Typography>
                    <Typography variant="body1">
                      {form.creationDate || 'Not provided'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card variant="outlined">
              <CardHeader
                title="File & Blockchain Details"
                titleTypographyProps={{ variant: 'subtitle1' }}
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Certificate File
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mt: 1,
                      }}
                    >
                      {certificateFile ? (
                        <>
                          <FileIcon color="primary" />
                          <Box>
                            <Typography variant="body1">
                              {certificateFile.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {IPFSService.formatFileSize(certificateFile.size)}
                            </Typography>
                          </Box>
                          {ipfsResult && (
                            <Chip
                              icon={<CheckCircleIcon />}
                              label="On IPFS"
                              size="small"
                              color="success"
                              sx={{ ml: 'auto' }}
                            />
                          )}
                        </>
                      ) : (
                        <Typography variant="body1" color="text.secondary">
                          No file selected
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Storage
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Blockchain"
                        color="primary"
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                      {certificateFile ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="IPFS"
                          color="success"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          label="IPFS (Optional)"
                          color="default"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Before you proceed:</strong>
            <br />
            • All information will be permanently stored on the blockchain
            <br />
            • This action cannot be undone
            <br />
            • Gas fees will be charged for the transaction
            <br />• Transaction may take 15-30 seconds to confirm
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );

  const getStepContent = step => {
    switch (step) {
      case 0:
        return renderStep1();
      case 1:
        return renderStep2();
      case 2:
        return renderStep3();
      default:
        return 'Unknown step';
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 3 }}>
          Loading Institute Data...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Please wait while we fetch your institute details
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography
          variant="h3"
          color="primary"
          gutterBottom
          sx={{ fontWeight: 700 }}
        >
          Certificate Generation Portal
        </Typography>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Welcome,{' '}
          <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>
            {instituteName}
          </Box>
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Generate blockchain-verified certificates with optional IPFS storage
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <AppBar position="static" color="transparent" elevation={0}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                fontSize: '1.1rem',
                fontWeight: 500,
                py: 2,
              },
              '& .Mui-selected': {
                color: 'primary.main',
                fontWeight: 600,
              },
            }}
          >
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AddCircleIcon />
                  Generate Certificate
                </Box>
              }
              value={0}
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon />
                  Certificate History
                </Box>
              }
              value={1}
            />
          </Tabs>
        </AppBar>

        {/* Tab Content */}
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          {tabValue === 0 ? (
            <Box>
              {/* Stepper */}
              <Stepper
                activeStep={activeStep}
                sx={{
                  mb: 6,
                  '& .MuiStepLabel-label': {
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  },
                }}
              >
                {steps.map(label => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {/* Messages */}
              {error && (
                <Alert
                  severity="error"
                  sx={{ mb: 3 }}
                  action={
                    <IconButton size="small" onClick={() => setError(null)}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  {error}
                </Alert>
              )}

              {successMessage && (
                <Alert
                  severity="success"
                  sx={{ mb: 3 }}
                  action={
                    <Box>
                      {transactionHash && (
                        <Button
                          size="small"
                          href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ mr: 1 }}
                        >
                          Etherscan
                        </Button>
                      )}
                      {ipfsResult?.ipfsHash && (
                        <Button
                          size="small"
                          href={ipfsResult.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          IPFS
                        </Button>
                      )}
                    </Box>
                  }
                >
                  {successMessage}
                </Alert>
              )}

              {/* Step Content */}
              <Fade in={true}>
                <Box>{getStepContent(activeStep)}</Box>
              </Fade>

              {/* Navigation Buttons */}
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}
              >
                <Button
                  onClick={handleBack}
                  disabled={activeStep === 0 || generating}
                  variant="outlined"
                  size="large"
                >
                  Back
                </Button>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  {activeStep === steps.length - 1 ? (
                    <>
                      <Button
                        onClick={() => setActiveStep(0)}
                        variant="outlined"
                        size="large"
                        disabled={generating}
                      >
                        Start Over
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleGenerate}
                        disabled={generating || !form.name || !form.id}
                        size="large"
                        sx={{ px: 4 }}
                        startIcon={
                          generating ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : null
                        }
                      >
                        {generating ? 'Generating...' : 'Generate Certificate'}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={
                        (activeStep === 0 &&
                          (!form.name ||
                            !form.id ||
                            !form.degree ||
                            !form.department)) ||
                        (activeStep === 1 && uploading)
                      }
                      size="large"
                      sx={{ px: 4 }}
                    >
                      Continue
                    </Button>
                  )}
                </Box>
              </Box>

              {/* Success Display */}
              {submitSuccess && certificateId && (
                <Fade in={true}>
                  <Card
                    sx={{
                      mt: 4,
                      bgcolor: 'success.50',
                      borderColor: 'success.main',
                    }}
                  >
                    <CardContent>
                      <Box sx={{ textAlign: 'center' }}>
                        <CheckCircleIcon
                          sx={{ fontSize: 60, color: 'success.main', mb: 2 }}
                        />
                        <Typography
                          variant="h5"
                          gutterBottom
                          color="success.main"
                        >
                          Certificate Generated Successfully!
                        </Typography>
                        <Typography variant="body1" paragraph>
                          Your certificate has been stored on the blockchain
                        </Typography>
                        <Box sx={{ mb: 3 }}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Certificate ID:
                          </Typography>
                          <Paper
                            sx={{
                              p: 2,
                              bgcolor: 'background.paper',
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mt: 1,
                            }}
                          >
                            <Typography
                              variant="body1"
                              sx={{
                                fontFamily: 'monospace',
                                flex: 1,
                                wordBreak: 'break-all',
                              }}
                            >
                              {certificateId}
                            </Typography>
                            <Tooltip title="Copy">
                              <IconButton
                                onClick={() =>
                                  navigator.clipboard.writeText(certificateId)
                                }
                                size="small"
                              >
                                <FileCopyIcon />
                              </IconButton>
                            </Tooltip>
                          </Paper>
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 2,
                            justifyContent: 'center',
                          }}
                        >
                          <Button
                            variant="contained"
                            onClick={() =>
                              window.open(
                                `/certificate/${certificateId}`,
                                '_blank'
                              )
                            }
                            endIcon={<OpenInNewIcon />}
                          >
                            View Certificate
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => {
                              setSubmitSuccess(false);
                              setCertificateId('');
                              setTransactionHash('');
                              setSuccessMessage('');
                              setActiveStep(0);
                            }}
                          >
                            Generate Another
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Fade>
              )}
            </Box>
          ) : (
            /* TAB 1: Certificate History */
            <Box>
              {/* Search Bar */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <SearchIcon />
                    Search Certificates
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Search By</InputLabel>
                        <Select
                          value={searchField}
                          label="Search By"
                          onChange={e => setSearchField(e.target.value)}
                        >
                          <MenuItem value="all">All Fields</MenuItem>
                          <MenuItem value="certId">Certificate ID</MenuItem>
                          <MenuItem value="studentId">Student ID</MenuItem>
                          <MenuItem value="name">Student Name</MenuItem>
                          <MenuItem value="degree">Degree</MenuItem>
                          <MenuItem value="department">Department</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Search keyword"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        fullWidth
                        size="small"
                        InputProps={{
                          endAdornment: searchTerm && (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={handleClearSearch}
                              >
                                <ClearIcon />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          onClick={handleSearch}
                          fullWidth
                          startIcon={<SearchIcon />}
                        >
                          Search
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={handleClearSearch}
                          fullWidth
                        >
                          Clear
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                  {appliedSearch.term && (
                    <Box
                      sx={{
                        mt: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Chip
                        label={`${filteredHistory.length} results`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Filtered by <strong>{appliedSearch.field}</strong>{' '}
                        containing "<strong>{appliedSearch.term}</strong>"
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* History List */}
              {historyLoading ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <CircularProgress size={60} />
                  <Typography variant="h6" sx={{ mt: 3 }}>
                    Loading Certificate History...
                  </Typography>
                </Box>
              ) : filteredHistory.length > 0 ? (
                <Grid container spacing={3}>
                  {filteredHistory.map(certificate => (
                    <Grid item xs={12} key={certificate._id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={8}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 2,
                                  mb: 1,
                                }}
                              >
                                <Typography
                                  variant="h6"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {certificate.name}
                                </Typography>
                                <Chip
                                  label={`ID: ${certificate.studentId}`}
                                  size="small"
                                />
                                {certificate.ipfsHash && (
                                  <Chip
                                    icon={<CheckCircleIcon />}
                                    label="Has IPFS"
                                    size="small"
                                    color="info"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                <Box component="span" sx={{ fontWeight: 500 }}>
                                  {certificate.degree}
                                </Box>{' '}
                                •{' '}
                                <Box component="span">
                                  {certificate.department}
                                </Box>
                              </Typography>
                              <Box sx={{ mt: 2, display: 'flex', gap: 3 }}>
                                <Typography variant="body2">
                                  <strong>CGPA:</strong> {certificate.cgpa}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Session:</strong>{' '}
                                  {certificate.session}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Issued:</strong>{' '}
                                  {new Date(
                                    certificate.createdAt
                                  ).toLocaleDateString()}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid
                              item
                              xs={12}
                              md={4}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                              }}
                            >
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  variant="outlined"
                                  onClick={() =>
                                    window.open(
                                      `/certificate/${certificate.certId}`,
                                      '_blank'
                                    )
                                  }
                                  startIcon={<OpenInNewIcon />}
                                >
                                  View
                                </Button>
                                {certificate.ipfsHash && (
                                  <Button
                                    variant="contained"
                                    href={IPFSService.getIPFSFileUrl(
                                      certificate.ipfsHash
                                    )}
                                    target="_blank"
                                    startIcon={<FileIcon />}
                                  >
                                    IPFS
                                  </Button>
                                )}
                              </Box>
                            </Grid>
                          </Grid>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              mt: 2,
                              fontFamily: 'monospace',
                              color: 'text.secondary',
                              wordBreak: 'break-all',
                            }}
                          >
                            {certificate.certId}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <HistoryIcon
                    sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }}
                  />
                  <Typography variant="h6" color="text.secondary">
                    No Certificates Found
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    {appliedSearch.term
                      ? 'No certificates match your search criteria'
                      : 'Generate your first certificate to see it here'}
                  </Typography>
                  {!appliedSearch.term && (
                    <Button
                      variant="contained"
                      onClick={() => setTabValue(0)}
                      sx={{ mt: 3 }}
                    >
                      Generate Certificate
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default GenerateCertificatePage;
