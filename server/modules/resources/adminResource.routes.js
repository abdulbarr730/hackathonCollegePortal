const express = require('express');
const requireAdmin = require('../../core/middlewares/adminAuth');
const controller = require('./adminResource.controller');
const validate = require('../../core/middlewares/validate');

const router = express.Router();

/* ================= RESOURCE LIST ================= */
router.get('/', requireAdmin, controller.listResources);

/* ================= COUNTS ================= */
router.get('/counts', requireAdmin, controller.getCounts);

/* ================= APPROVAL FLOW ================= */
router.post('/:id/approve', requireAdmin, controller.approveResource);
router.post('/:id/reject', requireAdmin, controller.rejectResource);

/* ================= UPDATE ================= */
router.put('/:id',
  requireAdmin,
  controller.updateResource
);

/* ================= DELETE ================= */
router.delete('/:id', requireAdmin, controller.deleteResource);
router.post('/bulk-delete',
  requireAdmin,
  validate.requireIdsArray,
  controller.bulkDeleteResources
);

/* ================= FILE ACCESS ================= */
router.get('/:id/view', requireAdmin, controller.viewResource);
router.get('/:id/download', requireAdmin, controller.downloadResource);

module.exports = router;