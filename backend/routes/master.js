// backend/routes/master.js
const express = require('express');
const router = express.Router();
const { getAllItems, updateItem } = require('../services/dynamoClient');

router.get('/get-master', async (req, res) => {
  try {
    const items = await getAllItems();
    res.json(items);
  } catch {
    res.status(500).json({ error: "Failed to fetch master list" });
  }
});

router.post('/update-master', async (req, res) => {
  const { vehicleProgram, changes } = req.body;

  const tableMap = {
    "KX": "MasterList_KX",
    "WS REPB": "MasterList_WS_REPB",
    "DT REPB": "MasterList_DT_REPB",
    "WL": "MasterList_WL"
  };

  const tableName = tableMap[vehicleProgram];
  if (!tableName) {
    return res.status(400).json({ error: "Invalid vehicle program for update." });
  }

  console.log("🔧 Incoming updates for", vehicleProgram);
  console.log(JSON.stringify(changes, null, 2));

  try {
    for (const item of changes) {
      const sanitizedItem = {
        ECU: item.ECU,
        PartNum: item.ExpectedPartNum ?? item.PartNum,
        SWVersion: item.ExpectedSW ?? item.SWVersion,
        Priority: item.Priority,
        FIOwner: item.FIOwner,
        SubsystemOwner: item.SubsystemOwner
      };
      await updateItem(sanitizedItem, tableName); // ✅ Pass table name here
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Update error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

module.exports = router;
