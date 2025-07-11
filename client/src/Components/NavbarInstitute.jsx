import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  AccountCircle,
  AccountBalanceWalletTwoTone as CertifyIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const NavBarInstitute = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

  const handleProfileMenuOpen = event => setAnchorEl(event.currentTarget);
  const handleMobileMenuOpen = event =>
    setMobileMoreAnchorEl(event.currentTarget);
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMobileMoreAnchorEl(null);
  };

  const renderMenu = (
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
  );

  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMoreAnchorEl}
      open={isMobileMenuOpen}
      onClose={handleMenuClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <MenuItem onClick={handleProfileMenuOpen}>
        <IconButton color="inherit">
          <AccountCircle />
        </IconButton>
        <p>Profile</p>
      </MenuItem>
    </Menu>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="default">
        <Toolbar>
          <IconButton
            component={Link}
            to="/"
            edge="start"
            color="primary"
            sx={{ mr: 2 }}
          >
            <CertifyIcon />
          </IconButton>

          <Typography
            variant="h6"
            color="primary"
            sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 'bold' }}
          >
            Blockchain Certificate System
          </Typography>

          <Typography
            sx={{
              pl: 4,
              fontWeight: 500,
              display: { xs: 'none', md: 'block' },
            }}
          >
            Institution Credential Management Portal
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          {/* Desktop */}
          {!isMobile && (
            <IconButton
              edge="end"
              aria-label="menu"
              aria-controls="desktop-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <LinkIcon />
            </IconButton>
          )}

          {/* Mobile */}
          {isMobile && (
            <IconButton
              edge="end"
              aria-label="menu"
              aria-controls="mobile-menu"
              aria-haspopup="true"
              onClick={handleMobileMenuOpen}
              color="inherit"
            >
              <LinkIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {renderMenu}
      {renderMobileMenu}
    </Box>
  );
};

export default NavBarInstitute;
