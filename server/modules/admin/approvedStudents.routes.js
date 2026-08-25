const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const controller = require('./approvedStudents.controller');
const adminAuth = require('../../core/middlewares/adminAuth');
const spocAuth = require('../../core/middlewares/spocAuth');

// All endpoints require admin or SPOC auth
router.use(adminAuth);

router.get('/', controller.listApprovedStudents);
router.post('/upload', upload.single('file'), controller.bulkUpload);
router.post('/single', controller.addSingle);
router.delete('/bulk-delete', controller.bulkDelete);
router.delete('/:id', controller.deleteSingle);

module.exports = router;
