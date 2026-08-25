const newsletterService = require('./newsletter.service');
const asyncHandler = require('../../core/utils/asyncHandler');

exports.subscribe = asyncHandler(async (req, res) => {
  const clientUrl = req.protocol + '://' + req.get('host');
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const result = await newsletterService.subscribe(
    req.body.email, 
    req.body.clientUrl || clientUrl,
    { acceptedIp: String(clientIp).split(',')[0].trim() }
  );
  res.status(201).json(result);
});

exports.verifySubscription = asyncHandler(async (req, res) => {
  const result = await newsletterService.verifySubscription(req.query.token || req.body.token);
  res.json(result);
});

exports.getSubscribers = asyncHandler(async (req, res) => {
  const result = await newsletterService.getSubscribers(req.query);
  res.json(result);
});

exports.sendNewsletter = asyncHandler(async (req, res) => {
  const clientUrl = req.protocol + '://' + req.get('host');
  const result = await newsletterService.sendNewsletter({
    subject: req.body.subject,
    content: req.body.content,
    recipientEmails: req.body.recipientEmails,
    mode: req.body.mode,
    targetAudience: req.body.targetAudience,
    user: req.user,
    clientUrl: req.body.clientUrl || clientUrl
  });
  res.status(201).json(result);
});

exports.deleteSubscriber = asyncHandler(async (req, res) => {
  const result = await newsletterService.deleteSubscriber(req.params.id);
  res.json(result);
});
