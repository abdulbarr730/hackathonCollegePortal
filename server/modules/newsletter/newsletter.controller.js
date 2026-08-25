const newsletterService = require('./newsletter.service');
const asyncHandler = require('../../core/utils/asyncHandler');

exports.subscribe = asyncHandler(async (req, res) => {
  const result = await newsletterService.subscribe(req.body.email);
  res.status(201).json(result);
});

exports.getSubscribers = asyncHandler(async (req, res) => {
  const result = await newsletterService.getSubscribers(req.query);
  res.json(result);
});

exports.sendNewsletter = asyncHandler(async (req, res) => {
  const result = await newsletterService.sendNewsletter({
    subject: req.body.subject,
    content: req.body.content,
    user: req.user
  });
  res.status(201).json(result);
});

exports.deleteSubscriber = asyncHandler(async (req, res) => {
  const result = await newsletterService.deleteSubscriber(req.params.id);
  res.json(result);
});
