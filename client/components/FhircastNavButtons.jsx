// npmPackages/fhircast-module/client/components/FhircastNavButtons.jsx

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import {
  Settings as SettingsIcon,
  Subscriptions as SubscriptionsIcon,
  Publish as PublishIcon
} from '@mui/icons-material';

// =============================================================================
// FHIRCAST NAV BUTTONS
// =============================================================================

var footerRoutes = [
  { label: 'Config', path: '/fhircast-config', icon: SettingsIcon },
  { label: 'Subscribe', path: '/fhircast-subscribe', icon: SubscriptionsIcon },
  { label: 'Publish', path: '/fhircast-publish', icon: PublishIcon }
];

function FhircastNavButtons() {
  var navigate = useNavigate();
  var location = useLocation();

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'center',
      width: '100%'
    }}>
      {footerRoutes.map(function(route) {
        var isActive = location.pathname === route.path;
        var IconComponent = route.icon;

        return (
          <Button
            key={route.path}
            id={'fhircast' + route.label + 'Button'}
            variant={isActive ? 'contained' : 'text'}
            color={isActive ? 'secondary' : 'inherit'}
            size="small"
            startIcon={<IconComponent />}
            onClick={function() { navigate(route.path); }}
            sx={{
              textTransform: 'none',
              minWidth: 0,
              px: 1.5,
              fontSize: '0.75rem'
            }}
          >
            {route.label}
          </Button>
        );
      })}
    </Box>
  );
}

export default FhircastNavButtons;
