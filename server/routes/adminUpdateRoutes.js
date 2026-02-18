const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const multer = require('multer');

const Update = require('../models/Update');
const Hackathon = require('../models/Hackathon');
const requireAdmin = require('../middleware/adminAuth');
const supabase = require('../config/supabase');

// --- MULTER CONFIG ---
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// 1. UPLOAD ROUTE (Mounted at /upload inside this file)
router.post('/upload', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ msg: 'No file uploaded' });

    const fileExt = file.originalname.split('.').pop();
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${Date.now()}_${cleanName}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    const { data, error } = await supabase.storage
      .from('updates')
      .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: false });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('updates')
      .getPublicUrl(filePath);

    res.json({ url: publicUrlData.publicUrl });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ msg: 'Upload failed', error: err.message });
  }
});

// 2. RETAG ROUTE
router.post('/retag-all', requireAdmin, async (req, res) => {
  try {
    const activeHackathon = await Hackathon.findOne({ isActive: true });
    if (!activeHackathon) return res.status(400).json({ msg: 'No Active Hackathon found.' });

    const result = await Update.updateMany(
      { hackathon: null },
      { $set: { hackathon: activeHackathon._id } }
    );
    res.json({ msg: `Tagged ${result.modifiedCount} updates to ${activeHackathon.name}.` });
  } catch (err) {
    res.status(500).json({ msg: 'Retagging Failed' });
  }
});

// 3. CRUD ROUTES (Root of this file matches /api/admin/updates)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const updates = await Update.find()
      .populate('hackathon', 'name shortName')
      .sort({ pinned: -1, publishedAt: -1 });
    res.json({ items: updates });
  } catch (err) { res.status(500).json({ msg: 'Server Error' }); }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const { title, summary, url, isPublic, pinned, hackathon, fileUrl } = req.body;
    if (!title?.trim()) return res.status(400).json({ msg: 'Title required' });

    const newUpdate = new Update({
      title, summary, url, fileUrl, isPublic, pinned,
      hackathon: hackathon || null,
      source: 'manual',
      hash: crypto.createHash('sha256').update(title + (url||'')).digest('hex')
    });

    await newUpdate.save();
    res.status(201).json({ ok: true, item: newUpdate });
  } catch (err) { res.status(500).json({ msg: 'Create Failed' }); }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const updated = await Update.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json({ ok: true, item: updated });
  } catch (err) { res.status(500).json({ msg: 'Update Failed' }); }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await Update.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Deleted' });
  } catch (err) { res.status(500).json({ msg: 'Delete Failed' }); }
});

module.exports = router;