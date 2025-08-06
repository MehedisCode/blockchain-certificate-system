import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Button,
} from '@mui/material';
import AccountBalanceWalletTwoToneIcon from '@mui/icons-material/AccountBalanceWalletTwoTone';
import { Link } from 'react-router-dom';

const NavBarLanding = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="default">
        <Toolbar>
          <IconButton component={Link} to="/" edge="start" color="primary">
            <AccountBalanceWalletTwoToneIcon />
          </IconButton>

          <Typography
            variant="h6"
            color="primary"
            noWrap
            sx={{ fontWeight: 'bold', ml: 1 }}
          >
            Blockchain Certificate System
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          {/* Always visible navigation buttons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button component={Link} to="/" color="inherit">
              Home
            </Button>
            <Button component={Link} to="/admin" color="inherit">
              Central Authority
            </Button>
            <Button component={Link} to="/institute" color="inherit">
              Institute
            </Button>
            <Button component={Link} to="/view-certificate" color="inherit">
              View Cert
            </Button>
            <Button
              onClick={() => {
                localStorage.removeItem('userAddress');
                setUserAddress(null);
              }}
              component={Link}
              color="inherit"
            >
              Log out
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default NavBarLanding;
