// npmPackages/fhircast-module/client/FhircastPublishPage.jsx

import React, { useState } from 'react';
import {
  Container, Box, Card, CardHeader, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import CastIcon from '@mui/icons-material/Cast';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import { Random } from 'meteor/random';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';

import { FhircastEvents } from '../lib/FhircastEvents';
import CollectionsToPublish from './components/CollectionsToPublish.jsx';
import PublishEvent from './components/PublishEvent.jsx';
import HubEventsFeed from './components/HubEventsFeed.jsx';
import AuditEventsColumn from './components/AuditEventsColumn.jsx';
import { useFhircastWebSocket } from './hooks/useFhircastWebSocket.js';
import { DEFAULT_WS_URL } from './lib/constants.js';

// =============================================================================
// FHIRCAST PUBLISH PAGE
// =============================================================================

var MAX_EVENTS = 200;

function FhircastPublishPage() {
  var [wsEndpoint] = useState(Random.id());
  var [sentEvents, setSentEvents] = useState([]);
  var [hubEvents, setHubEvents] = useState([]);
  var [columnMode, setColumnMode] = useState(2);

  // Subscribe to DDP events from Meteor pub/sub
  var ddpEvents = useTracker(function() {
    Meteor.subscribe('fhircast.events');
    return FhircastEvents.find({}, { sort: { _receivedAt: -1 }, limit: MAX_EVENTS }).fetch();
  }, []);

  var ws = useFhircastWebSocket({
    url: DEFAULT_WS_URL,
    endpoint: wsEndpoint,
    connect: true,
    onEvent: function(event) {
      setHubEvents(function(prev) {
        var next = [event].concat(prev);
        if (next.length > MAX_EVENTS) {
          next = next.slice(0, MAX_EVENTS);
        }
        return next;
      });
    }
  });

  // Merge WebSocket events and DDP events for the hub feed
  var mergedHubEvents = ddpEvents.concat(hubEvents);

  function handlePublishEvent(evt, id) {
    ws.publishEvent(evt, id);

    var sentRecord = {
      id: id || Random.id(),
      timestamp: new Date().toJSON(),
      event: evt
    };

    setSentEvents(function(prev) {
      var next = [sentRecord].concat(prev);
      if (next.length > MAX_EVENTS) {
        next = next.slice(0, MAX_EVENTS);
      }
      return next;
    });
  }

  function handleColumnModeChange(event, newMode) {
    if (newMode !== null) {
      setColumnMode(newMode);
    }
  }

  var gridColumns = columnMode === 2
    ? { xs: '1fr', md: '4fr 8fr' }
    : { xs: '1fr', md: '4fr 4fr 4fr' };

  return (
    <Container id="fhircastPublishPage" maxWidth={false} sx={{ py: 4, px: 3 }}>
      <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
        <CardHeader
          avatar={<CastIcon />}
          title="FHIRcast Publish"
          subheader="Event publishing and administration"
          action={
            <ToggleButtonGroup
              value={columnMode}
              exclusive
              onChange={handleColumnModeChange}
              size="small"
              sx={{ mr: 1 }}
            >
              <ToggleButton value={2} title="2-Column Layout">
                <ViewStreamIcon fontSize="small" sx={{ mr: 0.5 }} />
                2-Col
              </ToggleButton>
              <ToggleButton value={3} title="3-Column Layout">
                <ViewColumnIcon fontSize="small" sx={{ mr: 0.5 }} />
                3-Col
              </ToggleButton>
            </ToggleButtonGroup>
          }
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '& .MuiCardHeader-subheader': { color: 'primary.contrastText' },
            '& .MuiCardHeader-avatar': { color: 'primary.contrastText' }
          }}
        />
      </Card>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: gridColumns,
        gap: 2,
        minHeight: 0
      }}>
        {/* Column 1: Hub URL + Collections Config + Publish Event */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <CollectionsToPublish />
          <PublishEvent
            isPublishAllowed={ws.isBound}
            onPublishEvent={handlePublishEvent}
          />
        </Box>

        {/* Column 2: Hub Events Feed */}
        <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <HubEventsFeed
            hubEvents={mergedHubEvents}
            sentEvents={sentEvents}
          />
        </Box>

        {/* Column 3: Audit Events (only in 3-column mode) */}
        {columnMode === 3 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            <AuditEventsColumn />
          </Box>
        ) : null}
      </Box>
    </Container>
  );
}

export default FhircastPublishPage;
