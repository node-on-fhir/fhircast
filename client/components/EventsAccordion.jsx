// npmPackages/fhircast-module/client/components/EventsAccordion.jsx

import React, { useState } from 'react';
import {
  Card, CardHeader, CardContent,
  Accordion, AccordionSummary, AccordionDetails,
  Alert, Chip, Typography, Box, Collapse, IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { get } from 'lodash';

// =============================================================================
// HELPERS
// =============================================================================

function groupEventsByType(events) {
  var groups = {};

  events.forEach(function(evt) {
    var eventName = get(evt, 'event[hub.event]', get(evt, 'event.hub\\.event', 'unknown'));
    if (!groups[eventName]) {
      groups[eventName] = [];
    }
    groups[eventName].push(evt);
  });

  return groups;
}

// =============================================================================
// EVENT ITEM
// =============================================================================

function EventItem({ evt, severity }) {
  const [expanded, setExpanded] = useState(false);

  var eventTopic = get(evt, 'event[hub.topic]', get(evt, 'event.hub\\.topic', ''));
  var eventId = get(evt, 'id', '');
  var timestamp = get(evt, 'timestamp', '');

  return (
    <Alert
      severity={severity}
      sx={{ mb: 1, cursor: 'pointer' }}
      onClick={function() { setExpanded(!expanded); }}
      action={
        <IconButton size="small" sx={{ color: 'inherit' }}>
          {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      }
    >
      <Typography variant="body2">
        <strong>{eventId}</strong>
        {timestamp ? ' — ' + timestamp : ''}
        {eventTopic ? ' — topic: ' + eventTopic : ''}
      </Typography>
      <Collapse in={expanded}>
        <Box sx={{
          mt: 1,
          p: 1,
          fontFamily: 'monospace',
          fontSize: '0.75rem',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          bgcolor: 'background.default',
          borderRadius: 1
        }}>
          {JSON.stringify(evt, null, 2)}
        </Box>
      </Collapse>
    </Alert>
  );
}

// =============================================================================
// EVENTS ACCORDION
// =============================================================================

function EventsAccordion({ events, title, severity, emptyMessage }) {
  var effectiveTitle = title || 'Events';
  var effectiveSeverity = severity || 'info';
  var effectiveEmpty = emptyMessage || 'No events yet';

  var groups = groupEventsByType(events || []);
  var groupKeys = Object.keys(groups);

  return (
    <Card sx={{ bgcolor: 'background.paper' }}>
      <CardHeader
        title={effectiveTitle}
        action={
          events && events.length > 0 ? (
            <Chip
              label={events.length}
              size="small"
              color="default"
              sx={{ mr: 1 }}
            />
          ) : null
        }
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiCardHeader-title': {
            fontSize: '1.1rem'
          }
        }}
      />
      <CardContent sx={{ p: groupKeys.length > 0 ? 0 : 2, '&:last-child': { pb: groupKeys.length > 0 ? 0 : 2 } }}>
        {groupKeys.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            {effectiveEmpty}
          </Typography>
        ) : (
          groupKeys.map(function(eventType) {
            var groupEvents = groups[eventType];
            return (
              <Accordion
                key={eventType}
                disableGutters
                defaultExpanded
                sx={{
                  bgcolor: 'transparent',
                  boxShadow: 'none',
                  '&:before': { display: 'none' }
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                    {eventType}
                  </Typography>
                  <Chip
                    label={groupEvents.length}
                    size="small"
                    color="info"
                  />
                </AccordionSummary>
                <AccordionDetails sx={{ px: 2, pt: 0 }}>
                  {groupEvents.map(function(evt, index) {
                    return (
                      <EventItem
                        key={get(evt, 'id', index)}
                        evt={evt}
                        severity={effectiveSeverity}
                      />
                    );
                  })}
                </AccordionDetails>
              </Accordion>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export default EventsAccordion;
