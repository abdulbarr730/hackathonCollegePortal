const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const multer = require('multer');
const controller = require('./adminUpdate.controller');

const Update = require('./update.model');
const Hackathon = require('../hackathons/hackathon.model');
const requireAdmin = require('../../core/middlewares/adminAuth'); // Updated path for adminAuth middleware
const supabase = require('../../shared/services/supabase.service');

// --- MULTER CONFIG ---
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// 1. UPLOAD ROUTE (Mounted at /upload inside this file)
router.post('/upload', requireAdmin, upload.single('file'), controller.uploadUpdateFile);

// 2. RETAG ROUTE
router.post('/retag-all', requireAdmin, controller.retagAllUpdates);

// 3. CRUD ROUTES (Root of this file matches /api/admin/updates)
router.get('/', requireAdmin, controller.listUpdates);

router.post('/', requireAdmin, controller.createUpdate);

router.put('/:id', requireAdmin, controller.updateUpdate);

router.delete('/:id', requireAdmin, controller.deleteUpdate);

module.exports = router;