const express = require('express');
const router = express.Router();
const beneficiaryModel = require('../models/Beneficiary');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  try {
    const list = await beneficiaryModel.getAllForUser(req.user.id);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, country, currency, bankName, accountNumber, swiftBic } = req.body;
    const beneficiary = await beneficiaryModel.create({
      userId: req.user.id,
      name,
      country,
      currency,
      bankName,
      accountNumber,
      swiftBic
    });
    res.status(201).json(beneficiary);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const updated = await beneficiaryModel.update(req.params.id, req.user.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const success = await beneficiaryModel.delete(req.params.id, req.user.id);
    if (!success) return res.status(404).json({ error: 'Beneficiary not found or unauthorized' });
    res.json({ message: 'Beneficiary deleted successfully', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
