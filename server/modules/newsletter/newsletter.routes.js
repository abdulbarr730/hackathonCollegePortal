const express = require('express');
const router = express.Router();
const controller = require('./newsletter.controller');
const superAdmin = require('../../core/middlewares/superAdminAuth');

// Public Subscription & Double Opt-in Verification
router.post('/subscribe', controller.subscribe);
router.get('/verify', controller.verifySubscription);
router.post('/verify', controller.verifySubscription);

// Super Admin Only Governance
router.get('/subscribers', superAdmin, controller.getSubscribers);
router.post('/send', superAdmin, controller.sendNewsletter);
router.delete('/subscribers/:id', superAdmin, controller.deleteSubscriber);

module.exports = router;
