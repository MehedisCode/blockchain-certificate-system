import React, { useState } from 'react';
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

const InstitutePage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [courseIndex, setCourseIndex] = useState(0);
  const [certificateId, setCertificateId] = useState('1234-5678');
  const [revokeCertificateId, setRevokeCertificateId] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [revokeSuccess, setRevokeSuccess] = useState(false);

  const handleTabChange = (_, newValue) => setTabValue(newValue);

  const dummyCourses = [
    { course_name: 'Blockchain Basics' },
    { course_name: 'Smart Contracts' },
  ];

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
          </Paper>

          {tabValue === 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Input the certificate details below to generate a certificate
              </Typography>

              <TextField
                fullWidth
                label="Institute Name"
                value="My Blockchain Institute"
                margin="normal"
                InputProps={{ readOnly: true }}
              />
              <TextField
                fullWidth
                label="Institute Acronym"
                value="MBI"
                margin="normal"
                InputProps={{ readOnly: true }}
              />
              <TextField
                fullWidth
                label="Institute Website"
                value="https://mbi.org"
                margin="normal"
                InputProps={{ readOnly: true }}
              />

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                <TextField
                  label="First Name"
                  value={firstname}
                  onChange={e => setFirstname(e.target.value)}
                />
                <TextField
                  label="Last Name"
                  value={lastname}
                  onChange={e => setLastname(e.target.value)}
                />
              </Box>

              <FormControl fullWidth sx={{ mt: 3 }}>
                <InputLabel>Course</InputLabel>
                <Select
                  value={courseIndex}
                  label="Course"
                  onChange={e => setCourseIndex(e.target.value)}
                >
                  {dummyCourses.map((course, index) => (
                    <MenuItem value={index} key={index}>
                      {course.course_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

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
                  onClick={() => setSubmitSuccess(true)}
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

          {tabValue === 1 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Input the ID of the certificate you want to revoke
              </Typography>

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
