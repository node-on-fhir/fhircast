// npmPackages/fhircast-module/client/components/CollectionsToPublish.jsx

import React, { useState } from 'react';
import {
  Card, CardHeader, CardContent,
  Autocomplete, TextField, Chip,
  Typography, IconButton, Snackbar, Alert, Box
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CastIcon from '@mui/icons-material/Cast';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';

// =============================================================================
// CONSTANTS
// =============================================================================

var RESOURCE_TYPE_OPTIONS = [
  'Patient',
  'Observation',
  'Condition',
  'Procedure',
  'Encounter',
  'DiagnosticReport',
  'DocumentReference',
  'ImagingStudy',
  'MedicationRequest',
  'MedicationAdministration',
  'AllergyIntolerance',
  'Immunization',
  'CarePlan',
  'CareTeam',
  'ServiceRequest',
  'Goal',
  'Device',
  'Organization',
  'Practitioner',
  'Location'
].map(function(value) {
  return { value: value, label: value };
});

// =============================================================================
// COLLECTIONS TO PUBLISH
// =============================================================================

function CollectionsToPublish() {
  var [copySuccess, setCopySuccess] = useState(false);

  var hubUrl = get(Meteor, 'settings.public.fhircast.hubUrl', '') || (window.location.origin + '/api/hub');

  function handleCopyHubUrl(){
    navigator.clipboard.writeText(hubUrl).then(function(){
      setCopySuccess(true);
    }, function(err){
      console.error('Could not copy hub URL: ', err);
    });
  }

  var selectedCollections = useTracker(function() {
    return Session.get('fhircast.selectedCollections') || [];
  }, []);

  var selectedOptions = selectedCollections.map(function(value) {
    return { value: value, label: value };
  });

  function handleChange(event, newValue) {
    var values = newValue.map(function(o) { return o.value; });
    Session.set('fhircast.selectedCollections', values);
  }

  return (
    <>
    <Card sx={{ bgcolor: 'background.paper', mb: 2 }}>
      <CardHeader
        avatar={<CastIcon color="primary" />}
        title="FHIRCast Hub URL"
        action={
          <IconButton onClick={handleCopyHubUrl} size="small" title="Copy Hub URL">
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        }
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiCardHeader-title': {
            fontSize: '1.1rem'
          }
        }}
      />
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="body1"
            sx={{
              fontFamily: 'monospace',
              bgcolor: 'action.hover',
              px: 2,
              py: 1,
              borderRadius: 1,
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {hubUrl}
          </Typography>
        </Box>
      </CardContent>
    </Card>

    <Card sx={{ bgcolor: 'background.paper' }}>
      <CardHeader
        title="Collections to Publish"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiCardHeader-title': {
            fontSize: '1.1rem'
          }
        }}
      />
      <CardContent>
        <Autocomplete
          id="collectionsSelect"
          multiple
          options={RESOURCE_TYPE_OPTIONS}
          getOptionLabel={function(option) { return option.label; }}
          value={selectedOptions}
          isOptionEqualToValue={function(option, value) {
            return option.value === value.value;
          }}
          onChange={handleChange}
          renderTags={function(value, getTagProps) {
            return value.map(function(option, index) {
              return (
                <Chip
                  key={option.value}
                  label={option.label}
                  size="small"
                  color="info"
                  {...getTagProps({ index: index })}
                />
              );
            });
          }}
          renderInput={function(params) {
            return <TextField {...params} label="FHIR Resource Types" />;
          }}
        />
      </CardContent>
    </Card>

    <Snackbar
      open={copySuccess}
      autoHideDuration={3000}
      onClose={function(){ setCopySuccess(false); }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={function(){ setCopySuccess(false); }} severity="success" sx={{ width: '100%' }}>
        Copied to clipboard!
      </Alert>
    </Snackbar>
    </>
  );
}

export default CollectionsToPublish;
