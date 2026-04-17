// npmPackages/fhircast-module/client/components/SubscriptionList.jsx

import React from 'react';
import {
  Card, CardHeader, CardContent,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Chip, Typography
} from '@mui/material';

// =============================================================================
// SUB ROW
// =============================================================================

function SubRow({ sub }) {
  return (
    <TableRow>
      <TableCell sx={{ color: 'text.primary' }}>{sub.topic}</TableCell>
      <TableCell>
        {sub.events.map(function(e) {
          return (
            <Chip
              key={e}
              label={e}
              size="small"
              color="info"
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          );
        })}
      </TableCell>
    </TableRow>
  );
}

// =============================================================================
// SUBSCRIPTION LIST
// =============================================================================

function SubscriptionList({ subs }) {
  return (
    <Card sx={{ mb: 2, bgcolor: 'background.paper' }}>
      <CardHeader
        title="Subscriptions"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiCardHeader-title': {
            fontSize: '1.1rem'
          }
        }}
      />
      <CardContent>
        {subs.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            No active subscriptions
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small" id="subscriptionListTable">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Topic</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Events</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subs.map(function(sub) {
                  return <SubRow key={sub.topic} sub={sub} />;
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default SubscriptionList;
