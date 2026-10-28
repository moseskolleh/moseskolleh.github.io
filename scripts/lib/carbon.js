'use strict';
// ===================================================================
// CARBON — the build's one copy of the grams of CO₂e per MB
//
// The Sustainable Web Design constant the footer badge weighs a page
// with (script.js keeps the browser's copy, and the ledger's web-carbon
// entry says what it is). The pull request's receipt (scripts/receipt.js)
// weighs with this one, and tests/claims.test.js fails if any copy
// drifts from the ledger.
// ===================================================================

// Sustainable Web Design model v3, global average grid: data-centre, network
// and end-user device energy, allocated per byte transferred.
const GRAMS_PER_MB = 0.36;

/** Grams CO₂e for a transferred payload, Sustainable Web Design model. */
const grams = bytes => (bytes / (1024 * 1024)) * GRAMS_PER_MB;

module.exports = { GRAMS_PER_MB, grams };
