// npmPackages/fhircast-module/client/components/FhircastNavButtons.jsx

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  Button,
  ButtonGroup
} from '@mui/material';

import {
  Settings as SettingsIcon,
  Subscriptions as SubscriptionsIcon,
  Publish as PublishIcon
} from '@mui/icons-material';

// =============================================================================
// FHIRCAST NAV BUTTONS
// =============================================================================

function FhircastNavButtons() {
  var navigate = useNavigate();
  var location = useLocation();
  var currentPath = location.pathname;

  function handleNavigate(path) {
    if (currentPath !== path) {
      navigate(path);
    }
  }

  return (
    <ButtonGroup
      variant="contained"
      aria-label="fhircast navigation buttons"
      sx={{ width: '100%' }}
    >
      <Button
        id="fhircastConfigButton"
        color={currentPath === '/fhircast-config' ? 'primary' : 'inherit'}
        onClick={function() { handleNavigate('/fhircast-config'); }}
        startIcon={<SettingsIcon />}
        disabled={currentPath === '/fhircast-config'}
        sx={{ flex: 1 }}
      >
        Config
      </Button>
      <Button
        id="fhircastSubscribeButton"
        color={currentPath === '/fhircast-subscribe' ? 'primary' : 'inherit'}
        onClick={function() { handleNavigate('/fhircast-subscribe'); }}
        startIcon={<SubscriptionsIcon />}
        disabled={currentPath === '/fhircast-subscribe'}
        sx={{ flex: 1 }}
      >
        Subscribe
      </Button>
      <Button
        id="fhircastPublishButton"
        color={currentPath === '/fhircast-publish' ? 'primary' : 'inherit'}
        onClick={function() { handleNavigate('/fhircast-publish'); }}
        startIcon={<PublishIcon />}
        disabled={currentPath === '/fhircast-publish'}
        sx={{ flex: 1 }}
      >
        Publish
      </Button>
    </ButtonGroup>
  );
}

export default FhircastNavButtons;
