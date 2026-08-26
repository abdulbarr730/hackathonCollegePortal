const { getFrontendUrl } = require('../../core/utils/urlHelper');
const newsletterService = require('./newsletter.service');
const asyncHandler = require('../../core/utils/asyncHandler');

exports.subscribe = asyncHandler(async (req, res) => {
  const clientUrl = getFrontendUrl(req, req.body.clientUrl);
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const result = await newsletterService.subscribe(
    req.body.email, 
    clientUrl,
    { acceptedIp: String(clientIp).split(',')[0].trim() }
  );
  res.status(201).json(result);
});

exports.verifySubscription = asyncHandler(async (req, res) => {
  const token = req.query.token || req.body.token;
  const email = req.query.email || req.body.email;
  const result = await newsletterService.verifySubscription(token, email);
  res.json(result);
});

exports.getSubscribers = asyncHandler(async (req, res) => {
  const result = await newsletterService.getSubscribers(req.query);
  res.json(result);
});

exports.sendNewsletter = asyncHandler(async (req, res) => {
  const clientUrl = getFrontendUrl(req, req.body.clientUrl);
  const result = await newsletterService.sendNewsletter({
    subject: req.body.subject,
    content: req.body.content,
    recipientEmails: req.body.recipientEmails,
    mode: req.body.mode,
    targetAudience: req.body.targetAudience,
    user: req.user,
    clientUrl
  });
  res.status(201).json(result);
});

exports.deleteSubscriber = asyncHandler(async (req, res) => {
  const result = await newsletterService.deleteSubscriber(req.params.id);
  res.json(result);
});
