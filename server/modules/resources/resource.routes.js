const express = require('express');
const multer = require('multer');
const auth = require('../../core/middlewares/auth');
const controller = require('./resource.controller');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// URL submission
router.post('/', auth, controller.createUrlResource);

// File upload submission
router.post('/upload', auth, upload.single('file'), controller.createFileResource);

// Public listing
router.get('/', controller.listApprovedResources);

// Categories
router.get('/categories', controller.getApprovedCategories);

// View file
router.get('/:id/view', controller.viewFile);

// Download file
router.get('/:id/download', controller.downloadFile);

module.exports = router;