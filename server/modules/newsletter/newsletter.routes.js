const express = require('express');
const router = express.Router();
const controller = require('./newsletter.controller');
const superAdmin = require('../../core/middlewares/superAdminAuth');

// Public Subscription
router.post('/subscribe', controller.subscribe);

// Super Admin Only Governance
router.get('/subscribers', superAdmin, controller.getSubscribers);
router.post('/send', superAdmin, controller.sendNewsletter);
router.delete('/subscribers/:id', superAdmin, controller.deleteSubscriber);

module.exports = router;
