// npmPackages/fhircast-module/client/FhircastPublishPage.jsx

import React, { useState } from 'react';
import {
  Container, Box, Card, CardHeader
} from '@mui/material';
import CastIcon from '@mui/icons-material/Cast';
import { Random } from 'meteor/random';

import CollectionsToPublish from './components/CollectionsToPublish.jsx';
import PublishEvent from './components/PublishEvent.jsx';
import EventsAccordion from './components/EventsAccordion.jsx';
import { useFhircastWebSocket } from './hooks/useFhircastWebSocket.js';
import { DEFAULT_WS_URL } from './lib/constants.js';

// =============================================================================
// FHIRCAST PUBLISH PAGE
// =============================================================================

function FhircastPublishPage() {
  var [wsEndpoint] = useState(Random.id());
  var [sentEvents, setSentEvents] = useState([]);

  var ws = useFhircastWebSocket({
    url: DEFAULT_WS_URL,
    endpoint: wsEndpoint,
    connect: true,
    onEvent: function() {
      // Publish page only tracks sent events, not received
    }
  });

  function handlePublishEvent(evt, id) {
    ws.publishEvent(evt, id);

    var sentRecord = {
      id: id || Random.id(),
      timestamp: new Date().toJSON(),
      event: evt
    };

    setSentEvents(function(prev) { return [sentRecord].concat(prev); });
  }

  return (
    <Container id="fhircastPublishPage" maxWidth={false} sx={{ py: 4, px: 3 }}>
      <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
        <CardHeader
          avatar={<CastIcon />}
          title="FHIRcast Publish"
          subheader="Event publishing and debugging"
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
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
        gap: 2,
        minHeight: 0
      }}>
        {/* Column 1: Collections to Publish */}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <CollectionsToPublish />
        </Box>

        {/* Column 2: Publish Event */}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <PublishEvent
            isPublishAllowed={ws.isBound}
            onPublishEvent={handlePublishEvent}
          />
        </Box>

        {/* Column 3: Sent Events */}
        <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <EventsAccordion
            events={sentEvents}
            title="Sent Events"
            severity="success"
            emptyMessage="No events sent yet"
          />
        </Box>
      </Box>
    </Container>
  );
}

export default FhircastPublishPage;
