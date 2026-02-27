exports.requireIdsArray = (req, res, next) => {
  const ids = req.body?.ids;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ msg: 'Invalid IDs array' });
  }

  next();
};

exports.requireString = (field) => {
  return (req, res, next) => {
    const value = req.body?.[field];

    if (typeof value !== 'string' || !value.trim()) {
      return res.status(400).json({ msg: `${field} required` });
    }

    next();
  };
};