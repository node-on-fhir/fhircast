// npmPackages/fhircast-module/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { fetch } from 'meteor/fetch';

// =============================================================================
// METEOR METHODS (Meteor v3 Async Pattern)
// =============================================================================

Meteor.methods({
  /**
   * Get FHIRcast module status
   * @returns {Object} Module status information
   */
  'fhircast.getStatus': async function() {
    console.log('[fhircast.getStatus] Checking status');

    return {
      name: 'fhircast-module',
      version: '0.1.0',
      status: 'active',
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Forward subscription request to external FHIRcast hub
   * @param {String} hubUrl - The hub URL to subscribe to
   * @param {Object} subscriptionData - Subscription parameters
   * @returns {Object} Response from the hub
   */
  'fhircast.subscribe': async function(hubUrl, subscriptionData) {
    check(hubUrl, String);
    check(subscriptionData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    console.log('[fhircast.subscribe] Subscribing to hub:', hubUrl);
    console.log('[fhircast.subscribe] Topic:', subscriptionData['hub.topic']);

    try {
      var payload = Object.assign({}, subscriptionData);
      if (Array.isArray(payload['hub.events'])) {
        payload['hub.events'] = payload['hub.events'].join(',');
      }

      var response = await fetch(hubUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      var statusCode = response.status;
      console.log('[fhircast.subscribe] Hub response status:', statusCode);

      return {
        success: statusCode >= 200 && statusCode < 300,
        status: statusCode,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[fhircast.subscribe] Error:', error.message);
      throw new Meteor.Error('hub-error', 'Failed to connect to FHIRcast hub: ' + error.message);
    }
  },

  /**
   * Forward unsubscribe request to external FHIRcast hub
   * @param {String} hubUrl - The hub URL to unsubscribe from
   * @param {Object} subscriptionData - Unsubscription parameters
   * @returns {Object} Response from the hub
   */
  'fhircast.unsubscribe': async function(hubUrl, subscriptionData) {
    check(hubUrl, String);
    check(subscriptionData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    console.log('[fhircast.unsubscribe] Unsubscribing from hub:', hubUrl);

    try {
      var payload = Object.assign({}, subscriptionData, {
        'hub.mode': 'unsubscribe'
      });

      if (Array.isArray(payload['hub.events'])) {
        payload['hub.events'] = payload['hub.events'].join(',');
      }

      var response = await fetch(hubUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      var statusCode = response.status;
      console.log('[fhircast.unsubscribe] Hub response status:', statusCode);

      return {
        success: statusCode >= 200 && statusCode < 300,
        status: statusCode,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[fhircast.unsubscribe] Error:', error.message);
      throw new Meteor.Error('hub-error', 'Failed to unsubscribe from FHIRcast hub: ' + error.message);
    }
  },

  /**
   * Check hub status by sending a status request
   * @param {String} hubUrl - The hub URL to check
   * @returns {Object} Hub status information
   */
  'fhircast.getHubStatus': async function(hubUrl) {
    check(hubUrl, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    console.log('[fhircast.getHubStatus] Checking hub status:', hubUrl);

    try {
      var response = await fetch(hubUrl + '/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      var statusCode = response.status;
      var body = null;

      try {
        body = await response.json();
      } catch (e) {
        console.warn('[fhircast.getHubStatus] Could not parse response body');
      }

      return {
        success: statusCode >= 200 && statusCode < 300,
        status: statusCode,
        data: body,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[fhircast.getHubStatus] Error:', error.message);
      throw new Meteor.Error('hub-error', 'Failed to check hub status: ' + error.message);
    }
  },

  /**
   * Forward event publication to hub
   * @param {String} hubUrl - The hub URL
   * @param {Object} eventData - Event to publish
   * @returns {Object} Response from the hub
   */
  'fhircast.publishEvent': async function(hubUrl, eventData) {
    check(hubUrl, String);
    check(eventData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    console.log('[fhircast.publishEvent] Publishing event to hub:', hubUrl);

    try {
      var response = await fetch(hubUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });

      var statusCode = response.status;
      console.log('[fhircast.publishEvent] Hub response status:', statusCode);

      return {
        success: statusCode >= 200 && statusCode < 300,
        status: statusCode,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[fhircast.publishEvent] Error:', error.message);
      throw new Meteor.Error('hub-error', 'Failed to publish event: ' + error.message);
    }
  }
});

console.log('[fhircast-module] Server methods registered');
