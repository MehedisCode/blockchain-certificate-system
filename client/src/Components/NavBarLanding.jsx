import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Box,
  Button,
} from '@mui/material';
import { AccountCircle, Link as LinkIcon } from '@mui/icons-material';
import AccountBalanceWalletTwoToneIcon from '@mui/icons-material/AccountBalanceWalletTwoTone';
import { Link } from 'react-router-dom';

const NavBarLanding = () => {
  const [anchorEl, setAnchorEl] = useState(null);

  const isMenuOpen = Boolean(anchorEl);

  const handleMenuOpen = event => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

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
            sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 'bold' }}
          >
            Blockchain Certificate System
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          {/* Horizontal menu for medium and up */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
            <Button component={Link} to="/" color="inherit">
              Home
            </Button>
            <Button component={Link} to="/admin" color="inherit">
              Central Authority
            </Button>
            <Button component={Link} to="/institute" color="inherit">
              Institute
            </Button>
            <Button component={Link} to="/view" color="inherit">
              View Cert
            </Button>
          </Box>

          {/* Link icon for small screens */}
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              edge="end"
              aria-label="links"
              onClick={handleMenuOpen}
              color="inherit"
            >
              <LinkIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Dropdown menu for small screens */}
      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem component={Link} to="/" onClick={handleMenuClose}>
          Home
        </MenuItem>
        <MenuItem component={Link} to="/admin" onClick={handleMenuClose}>
          Central Authority Portal
        </MenuItem>
        <MenuItem component={Link} to="/institute" onClick={handleMenuClose}>
          Institute Portal
        </MenuItem>
        <MenuItem component={Link} to="/view" onClick={handleMenuClose}>
          View Certificate
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default NavBarLanding;
