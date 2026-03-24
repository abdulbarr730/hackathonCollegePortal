const { URL } = require('url');

/* ============================================================================
   SOCIAL URL VALIDATORS
   Keys MUST match exactly what the frontend sends and what is stored in the
   User.socialProfiles object:
     linkedin, github, leetcode, geeksforgeeks, stackoverflow,
     hackerrank, kaggle, codeforces, devto, medium, codechef, website
   Empty strings are silently ignored (user clearing a field).
============================================================================ */

const RX = {
  linkedin:      /^https?:\/\/(www\.)?linkedin\.com\/(in|pub)\/[A-Za-z0-9\-_%]+\/?$/i,
  github:        /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9\-_%]+\/?$/i,
  leetcode:      /^https?:\/\/leetcode\.com\/[A-Za-z0-9\-_%]+\/?$/i,
  geeksforgeeks: /^https?:\/\/(www\.|auth\.)?geeksforgeeks\.org\/(user\/)?[A-Za-z0-9\-_%]+\/?$/i,
  stackoverflow: /^https?:\/\/stackoverflow\.com\/users\/\d+\/[A-Za-z0-9\-_%]+\/?$/i,
  hackerrank:    /^https?:\/\/(www\.)?hackerrank\.com\/[A-Za-z0-9\-_%]+\/?$/i,
  kaggle:        /^https?:\/\/(www\.)?kaggle\.com\/[A-Za-z0-9\-_%]+\/?$/i,
  codeforces:    /^https?:\/\/(www\.)?codeforces\.com\/profile\/[A-Za-z0-9_\-]+\/?$/i,
  codechef:      /^https?:\/\/(www\.)?codechef\.com\/users\/[A-Za-z0-9_\-]+\/?$/i,
  devto:         /^https?:\/\/dev\.to\/[A-Za-z0-9\-_%]+\/?$/i,
  medium:        /^https?:\/\/(www\.)?medium\.com\/@?[A-Za-z0-9\-_%]+\/?$/i,
  website:       /^https?:\/\/.+$/i,  // any valid http/https URL
};

/** Normalise a URL string — returns '' if malformed */
function tidy(u = '') {
  try { return new URL(u).toString(); } catch { return ''; }
}

/**
 * Validates and cleans a social profiles payload.
 * - Unknown keys are silently dropped
 * - Empty/falsy values are silently ignored (allows clearing a field)
 * - Invalid URLs throw an Error with a human-readable message
 *
 * @param {object} payload - flat object e.g. { linkedin: '...', github: '...' }
 * @returns {object} cleaned - validated and normalised URLs only
 */
function validateSocial(payload = {}) {
  const cleaned = {};

  for (const [key, val] of Object.entries(payload)) {
    if (!val) continue; // empty string = user cleared the field, skip silently

    if (!RX[key]) continue; // unknown platform key — drop silently

    if (!RX[key].test(val)) {
      throw new Error(`Invalid ${key} URL`);
    }

    cleaned[key] = tidy(val);
  }

  return cleaned;
}

module.exports = { validateSocial };