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
router.post('/:id/dispatch-email', superAdminAuth, controller.dispatchUpdateEmail);

router.post('/sync-sih', superAdminAuth, controller.syncSIH);
router.delete('/purge/scraped', superAdminAuth, controller.deleteScrapedUpdates);
router.put('/action/retag-all', superAdminAuth, controller.retagAllUpdates);
router.post('/upload', adminAuth, upload.single('file'), controller.uploadUpdateFile);

module.exports = router;
