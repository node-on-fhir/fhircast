// npmPackages/fhircast-module/client/components/PublishEvent.jsx

import React, { useState } from 'react';
import {
  Card, CardHeader, CardContent,
  TextField, Button, Box, Alert, Typography,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Random } from 'meteor/random';

import { EventType } from '../lib/types.js';
import { DEFAULT_TOPIC, DEFAULT_CONTEXT } from '../lib/constants.js';

// =============================================================================
// PUBLISH EVENT
// =============================================================================

var EVENT_EVENT = 'hub.event';
var EVENT_TOPIC = 'hub.topic';

function PublishEvent({ isPublishAllowed, onPublishEvent }) {
  const [eventName, setEventName] = useState(EventType.PatientOpen);
  const [contextString, setContextString] = useState(
    JSON.stringify(DEFAULT_CONTEXT, null, 2)
  );
  const [contextError, setContextError] = useState(null);
  const [topic, setTopic] = useState(DEFAULT_TOPIC);
  const [previousId, setPreviousId] = useState(null);

  function validateContextJson(context) {
    try {
      var parsedContext = JSON.parse(context);
      var isArray = Array.isArray(parsedContext);
      var err = isArray ? null : 'Context should be an array';
      setContextError(err);
      return isArray;
    } catch (e) {
      setContextError('Invalid JSON');
      return false;
    }
  }

  function handlePublishEvent() {
    if (!validateContextJson(contextString)) {
      return;
    }

    if (!onPublishEvent) {
      return;
    }

    var evt = {};
    evt[EVENT_TOPIC] = topic;
    evt[EVENT_EVENT] = eventName;
    evt.context = JSON.parse(contextString);

    var id = Random.id();
    setPreviousId(id);
    onPublishEvent(evt, id);
  }

  function handleContextChange(e) {
    var value = e.target.value;
    setContextString(value);
    validateContextJson(value);
  }

  var isContextInvalid = Boolean(contextError);
  var isPublishDisabled = !isPublishAllowed || isContextInvalid;

  return (
    <Card sx={{ mb: 2, bgcolor: 'background.paper' }}>
      <CardHeader
        title="Publish Event"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiCardHeader-title': {
            fontSize: '1.1rem'
          }
        }}
      />
      <CardContent>
        <Box component="form" onSubmit={function(e) { e.preventDefault(); }}>
          <TextField
            id="publishTopicInput"
            fullWidth
            label="Topic"
            value={topic}
            onChange={function(e) { setTopic(e.target.value); }}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="event-type-label">Event</InputLabel>
            <Select
              labelId="event-type-label"
              id="eventTypeSelect"
              value={eventName}
              label="Event"
              onChange={function(e) { setEventName(e.target.value); }}
            >
              {Object.values(EventType).map(function(value) {
                return (
                  <MenuItem key={value} value={value}>{value}</MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <TextField
            id="contextTextarea"
            fullWidth
            multiline
            rows={6}
            label="Context"
            value={contextString}
            onChange={handleContextChange}
            error={isContextInvalid}
            helperText={contextError || (contextString ? 'Valid JSON' : '')}
            sx={{ mb: 2 }}
            InputProps={{
              sx: { fontFamily: 'monospace', fontSize: '0.8rem' }
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              id="publishButton"
              variant="contained"
              disabled={isPublishDisabled}
              onClick={handlePublishEvent}
            >
              Publish
            </Button>
          </Box>
        </Box>
      </CardContent>
      {previousId ? (
        <Box sx={{ px: 2, pb: 1 }}>
          <Typography variant="caption" sx={{ color: 'success.main' }}>
            Published event with ID <strong>{previousId}</strong>
          </Typography>
        </Box>
      ) : null}
    </Card>
  );
}

export default PublishEvent;
