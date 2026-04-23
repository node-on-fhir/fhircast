// npmPackages/fhircast-module/server/hub.js
//
// FHIRcast Hub HTTP Endpoint (STU3)
// Accepts subscription/unsubscription requests and stores them in memory.

import { WebApp } from 'meteor/webapp';
import { fetch } from 'meteor/fetch';
import { FhircastEvents } from '../lib/FhircastEvents';

// =============================================================================
// HELPERS
// =============================================================================

function sanitizeDottedKeys(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeDottedKeys);
  var result = {};
  Object.keys(obj).forEach(function(key) {
    var safeKey = key.replace(/\./g, '_');
    result[safeKey] = sanitizeDottedKeys(obj[key]);
  });
  return result;
}

// =============================================================================
// IN-MEMORY SUBSCRIPTION STORE
// =============================================================================

// Map<topic, Array<{ subscriber, events, channelType, createdAt }>>
const subscriptions = new Map();

// =============================================================================
// OPTIONS /api/hub — CORS preflight
// =============================================================================

WebApp.handlers.use('/api/hub', function(req, res, next) {
  if (req.method === 'OPTIONS') {
    console.log('[fhircast-hub] OPTIONS /api/hub — CORS preflight');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.writeHead(204);
    res.end();
    return;
  }
  next();
});

// =============================================================================
// POST /api/hub — Subscribe / Unsubscribe
// =============================================================================

WebApp.handlers.post('/api/hub', async function(req, res) {
  console.log('[fhircast-hub] POST /api/hub');
  console.log('[fhircast-hub] Content-Type:', req.headers['content-type']);
  console.log('[fhircast-hub] Body:', JSON.stringify(req.body));

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  var body = req.body || {};

  var mode = body['hub.mode'];
  var topic = body['hub.topic'];
  var events = body['hub.events'];
  var channelType = body['hub.channel.type'] || 'websocket';

  console.log('[fhircast-hub] mode:', mode);
  console.log('[fhircast-hub] topic:', topic);
  console.log('[fhircast-hub] events:', events);
  console.log('[fhircast-hub] channelType:', channelType);

  // Detect FHIRcast event notification (no hub.mode, has event.hub.topic)
  if (!mode && body.event && body.event['hub.topic']) {
    var eventTopic = body.event['hub.topic'];
    var eventName = body.event['hub.event'];
    console.log('[fhircast-hub] Event notification received:', eventName, 'topic:', eventTopic);
    console.log('[fhircast-hub] Subscribers for topic:', (subscriptions.get(eventTopic) || []).length);

    // Store in FhircastEvents so it appears via DDP on the publish page
    FhircastEvents.insertAsync(Object.assign({}, sanitizeDottedKeys(body), {
      _receivedAt: new Date().toISOString(),
      _source: 'hub-received'
    }));

    // Forward to subscribers
    var topicSubscribers = subscriptions.get(eventTopic) || [];
    topicSubscribers.forEach(function(sub) {
      if (sub.callback) {
        try {
          fetch(sub.callback, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          }).then(function(resp) {
            console.log('[fhircast-hub] Forwarded to', sub.callback, '— status:', resp.status);
          }).catch(function(err) {
            console.warn('[fhircast-hub] Forward failed to', sub.callback, ':', err.message);
          });
        } catch (err) {
          console.warn('[fhircast-hub] Forward error:', err.message);
        }
      }
    });

    // Forward to WebSocket clients
    topicSubscribers.forEach(function(sub) {
      if (sub.channelEndpoint && connectedClients.has(sub.channelEndpoint)) {
        try {
          sendWsMessage(connectedClients.get(sub.channelEndpoint), JSON.stringify(body));
          console.log('[fhircast-hub] Forwarded via WS to endpoint:', sub.channelEndpoint);
        } catch (err) {
          console.warn('[fhircast-hub] WS forward error:', err.message);
        }
      }
    });

    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'received',
      'hub.topic': eventTopic,
      'hub.event': eventName,
      subscribers: (subscriptions.get(eventTopic) || []).length,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Validate required fields
  if (!mode) {
    console.warn('[fhircast-hub] Missing hub.mode');
    res.writeHead(400);
    res.end(JSON.stringify({ error: 'Missing required field: hub.mode' }));
    return;
  }

  if (!topic) {
    console.warn('[fhircast-hub] Missing hub.topic');
    res.writeHead(400);
    res.end(JSON.stringify({ error: 'Missing required field: hub.topic' }));
    return;
  }

  // ---------------------------------------------------------------------------
  // SUBSCRIBE
  // ---------------------------------------------------------------------------
  if (mode === 'subscribe') {
    if (!events) {
      console.warn('[fhircast-hub] Missing hub.events for subscribe');
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Missing required field: hub.events' }));
      return;
    }

    var eventsArray = Array.isArray(events) ? events : String(events).split(',').map(function(e) { return e.trim(); });

    var subscriber = {
      callback: body['hub.callback'] || null,
      events: eventsArray,
      channelType: channelType,
      channelEndpoint: body['hub.channel.endpoint'] || null,
      createdAt: new Date().toISOString()
    };

    if (!subscriptions.has(topic)) {
      subscriptions.set(topic, []);
    }
    subscriptions.get(topic).push(subscriber);

    console.log('[fhircast-hub] Subscription stored for topic:', topic, '— events:', eventsArray.join(', '));
    console.log('[fhircast-hub] Total topics:', subscriptions.size, '— subscribers for this topic:', subscriptions.get(topic).length);

    var wsEndpoint = 'ws://localhost:' + (process.env.PORT || '3200') + '/ws/fhircast/' + encodeURIComponent(topic);

    res.writeHead(202);
    res.end(JSON.stringify({
      'hub.channel.endpoint': wsEndpoint,
      'hub.topic': topic,
      'hub.events': eventsArray,
      'hub.mode': 'subscribe',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // ---------------------------------------------------------------------------
  // UNSUBSCRIBE
  // ---------------------------------------------------------------------------
  if (mode === 'unsubscribe') {
    if (subscriptions.has(topic)) {
      var before = subscriptions.get(topic).length;
      // Remove last subscriber for this topic (simple strategy)
      subscriptions.get(topic).pop();
      if (subscriptions.get(topic).length === 0) {
        subscriptions.delete(topic);
      }
      console.log('[fhircast-hub] Unsubscribed from topic:', topic, '— was:', before, 'now:', (subscriptions.get(topic) || []).length);
    } else {
      console.log('[fhircast-hub] No subscriptions found for topic:', topic);
    }

    res.writeHead(202);
    res.end(JSON.stringify({
      'hub.mode': 'unsubscribe',
      'hub.topic': topic,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // ---------------------------------------------------------------------------
  // UNKNOWN MODE
  // ---------------------------------------------------------------------------
  console.warn('[fhircast-hub] Unknown hub.mode:', mode);
  res.writeHead(400);
  res.end(JSON.stringify({ error: 'Unknown hub.mode: ' + mode + '. Expected "subscribe" or "unsubscribe".' }));
});

// =============================================================================
// GET /api/hub — Status / Discovery
// =============================================================================

WebApp.handlers.get('/api/hub', async function(req, res) {
  console.log('[fhircast-hub] GET /api/hub — status request');

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  var topicDetails = {};
  var totalSubscribers = 0;

  subscriptions.forEach(function(subscribers, topic) {
    topicDetails[topic] = subscribers.map(function(sub) {
      return {
        events: sub.events,
        channelType: sub.channelType,
        createdAt: sub.createdAt
      };
    });
    totalSubscribers += subscribers.length;
  });

  var response = {
    status: 'active',
    hub: 'FHIRcast STU3 Hub',
    version: '0.1.0',
    totalTopics: subscriptions.size,
    totalSubscribers: totalSubscribers,
    topics: topicDetails,
    timestamp: new Date().toISOString()
  };

  res.writeHead(200);
  res.end(JSON.stringify(response, null, 2));
});

// =============================================================================
// POST /client — Receive forwarded FHIRcast events
// =============================================================================

WebApp.handlers.use('/client', function(req, res, next) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    return next();
  }

  var bodyStr = '';
  req.on('data', function(chunk) { bodyStr += chunk; });
  req.on('end', async function() {
    try {
      var body = JSON.parse(bodyStr);
      console.log('[fhircast-client] Received event:', JSON.stringify(body).substring(0, 200));

      await FhircastEvents.insertAsync(Object.assign({}, sanitizeDottedKeys(body), {
        _receivedAt: new Date().toISOString(),
        _source: 'hub-callback'
      }));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
    } catch (err) {
      console.error('[fhircast-client] Error:', err.message);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

// =============================================================================
// WEBSOCKET SERVER for /bind endpoint
// =============================================================================

var connectedClients = new Map();

WebApp.httpServer.on('upgrade', function(req, socket, head) {
  if (!req.url.startsWith('/bind/')) return;

  var endpoint = req.url.replace('/bind/', '');
  console.log('[fhircast-ws] Upgrade request for endpoint:', endpoint);

  // WebSocket handshake
  var key = req.headers['sec-websocket-key'];
  var crypto = require('crypto');
  var acceptKey = crypto.createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-5AB5DC65C4F3')
    .digest('base64');

  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    'Sec-WebSocket-Accept: ' + acceptKey + '\r\n\r\n'
  );

  connectedClients.set(endpoint, socket);
  console.log('[fhircast-ws] Client connected, endpoint:', endpoint);

  // Send { bound: true } — enables PUBLISH button
  sendWsMessage(socket, JSON.stringify({ bound: true }));

  socket.on('data', function(buf) {
    console.log('[fhircast-ws] Received data from client, endpoint:', endpoint, 'bytes:', buf.length);
  });
  socket.on('close', function() {
    connectedClients.delete(endpoint);
    console.log('[fhircast-ws] Client disconnected:', endpoint);
  });
  socket.on('error', function(err) {
    console.warn('[fhircast-ws] Socket error:', err.message);
    connectedClients.delete(endpoint);
  });
});

function sendWsMessage(socket, data) {
  var payload = Buffer.from(data);
  var frame;
  if (payload.length < 126) {
    frame = Buffer.alloc(2 + payload.length);
    frame[0] = 0x81;
    frame[1] = payload.length;
    payload.copy(frame, 2);
  } else if (payload.length < 65536) {
    frame = Buffer.alloc(4 + payload.length);
    frame[0] = 0x81;
    frame[1] = 126;
    frame.writeUInt16BE(payload.length, 2);
    payload.copy(frame, 4);
  } else {
    frame = Buffer.alloc(10 + payload.length);
    frame[0] = 0x81;
    frame[1] = 127;
    frame.writeBigUInt64BE(BigInt(payload.length), 2);
    payload.copy(frame, 10);
  }
  socket.write(frame);
}

// =============================================================================
// STARTUP LOG
// =============================================================================

console.log('[fhircast-hub] Hub endpoint registered at POST /api/hub');
console.log('[fhircast-hub] Hub status available at GET /api/hub');
console.log('[fhircast-hub] Client endpoint registered at POST /client');
console.log('[fhircast-hub] WebSocket server listening at /bind/<endpoint>');
