const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const adminAuth = require('../../core/middlewares/adminAuth');
const superAdminAuth = require('../../core/middlewares/superAdminAuth');
const controller = require('./adminUpdate.controller');

router.get('/', adminAuth, controller.listUpdates);
router.post('/', adminAuth, controller.createUpdate);
router.put('/:id', adminAuth, controller.updateUpdate);
router.delete('/:id', adminAuth, controller.deleteUpdate);
router.post('/:id/dispatch-email', adminAuth, controller.dispatchUpdateEmail);

router.post('/sync-sih', adminAuth, controller.syncSIH);
router.delete('/purge/scraped', adminAuth, controller.deleteScrapedUpdates);
router.put('/action/retag-all', superAdminAuth, controller.retagAllUpdates);
router.post('/upload', adminAuth, upload.single('file'), controller.uploadUpdateFile);

module.exports = router;
