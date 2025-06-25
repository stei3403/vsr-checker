const express = require('express');
const router = express.Router();
const { getAllItems, updateItem } = require('../services/dynamoClient'); // ✅ updated path

// GET /api/get-master
router.get('/get-master', async (req, res) => {
  try {
    const items = await getAllItems();
    const cleaned = items.map(item => ({
      ECU: item.ECU,
      SWVersion: item.SWVersion,
      Priority: item.Priority,
      FIOwner: item.FIOwner,
      SubsystemOwner: item.SubsystemOwner,
    }));
    res.json(cleaned);
  } catch (err) {
    console.error('Error fetching master list:', err);
    res.status(500).json({ error: 'Failed to fetch master list' });
  }
});

// POST /api/update-master
router.post('/update-master', async (req, res) => {
    const updates = req.body;
    console.log('🔧 Incoming updates:', JSON.stringify(updates, null, 2));

    try {
      for (const item of updates) {
        // 🔒 Guard: skip items missing composite key
        if (!item.ECU) {
          console.warn(`Skipping update for item with missing key:`, item);
          continue;
        }
  
        await updateItem(item); // assumes you imported this from dynamoClient
        console.log(`✅ Updated: ${item.ECU}`);
      }
  
      res.json({ success: true });
    } catch (err) {
      console.error('Error updating master list:', err);
      res.status(500).json({ error: 'Failed to update master list' });
    }
  });
  

module.exports = router;
