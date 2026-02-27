const { URL } = require('url');

const RX = {
  linkedIn:  /^https?:\/\/(www\.)?linkedin\.com\/(in|pub)\/[A-Za-z0-9\-_%]+\/?$/i,
  github:    /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9\-_%]+\/?$/i,
  leetCode:  /^https?:\/\/leetcode\.com\/[A-Za-z0-9\-_%]+\/?$/i,
  gfg:       /^https?:\/\/(www\.)?geeksforgeeks\.org\/[A-Za-z0-9\-_%]+\/?$/i,
  stackOver: /^https?:\/\/stackoverflow\.com\/users\/\d+\/[A-Za-z0-9\-_%]+\/?$/i,
  hackerRank:/^https?:\/\/(www\.)?hackerrank\.com\/[A-Za-z0-9\-_%]+\/?$/i,
  kaggle:    /^https?:\/\/(www\.)?kaggle\.com\/[A-Za-z0-9\-_%]+\/?$/i,
  codeforces:/^https?:\/\/(www\.)?codeforces\.com\/profile\/[A-Za-z0-9_\-]+\/?$/i,
};

function tidy(u = '') {
  try { return new URL(u).toString(); } catch { return ''; }
}

function validateSocial(payload = {}) {
  const cleaned = {};
  for (const [key, val] of Object.entries(payload)) {
    if (!val) continue;                 // ignore empty
    if (!RX[key] || !RX[key].test(val))
      throw new Error(`Invalid ${key} URL`);
    cleaned[key] = tidy(val);
  }
  return cleaned;
}

module.exports = { validateSocial };
