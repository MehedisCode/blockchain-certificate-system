import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Grid,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';

const Home = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Grid
      container
      sx={{
        minHeight: 'calc(100vh - 64px)',
        background:
          'linear-gradient(124deg, rgba(116,65,249,1) 0%, rgba(145,99,252,1) 36%, rgba(125,206,223,1) 100%)',
        color: 'white',
        px: 4,
        py: 8,
        textAlign: 'center',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Grid>
        <Typography variant="h2" sx={{ fontWeight: 900, mb: 3 }}>
          Blockchain Certificate System
        </Typography>

        <Typography variant="body1" sx={{ maxWidth: 700, mx: 'auto', mb: 4 }}>
          A Decentralized Certificate Issuance and Verification System to create
          certificates that are Immutable, Cryptographically Secured, and have
          Zero Downtime. All powered by Ethereum Smart Contracts.
        </Typography>

        <Typography variant="h6" sx={{ mb: 3 }}>
          What are you looking for?
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'center',
            gap: 3,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            size="large"
            component={Link}
            to="/institute"
            sx={{ fontWeight: 600 }}
          >
            Issue Certificates
          </Button>

          <Button
            variant="contained"
            color="secondary"
            size="large"
            component={Link}
            to="/view"
            sx={{
              backgroundColor: 'white',
              color: 'black',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: '#f0f0f0',
              },
            }}
          >
            View Certificates
          </Button>
        </Box>
      </Grid>
    </Grid>
  );
};

export default Home;
