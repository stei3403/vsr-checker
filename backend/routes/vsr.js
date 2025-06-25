const express = require('express');
const multer = require('multer');
const { parseVSR } = require('../utils/parser');
const {
  compareToMaster
} = require('../utils/compare');
const { getAllItems } = require('../services/dynamoClient');

const router = express.Router();
const upload = multer();

// 🚗 Vehicle program to table name map
const tableMap = {
  "KX": "MasterList_KX",
  "WS REPB": "MasterList_WS_REPB",
  "DT REPB": "MasterList_DT_REPB",
  "WL": "MasterList_WL"
};

router.post('/upload-vsr', upload.single('vsrfile'), async (req, res) => {
  try {
    const html = req.file.buffer.toString('utf8');
    const vehicleProgram = req.body.vehicleProgram;

    if (!vehicleProgram || !tableMap[vehicleProgram]) {
      return res.status(400).json({ error: 'Invalid or missing vehicle program.' });
      console.error('🚫 Invalid vehicleProgram received:', vehicleProgram);

    }

    const tableName = tableMap[vehicleProgram];
    const { ecuData, metadata, dtcData } = parseVSR(html);

    // Get the correct master list for the selected vehicle program
    const masterList = await getAllItems(tableName);

    const results = compareToMaster(ecuData, masterList);
    res.json({ results, metadata, dtcData });

  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ error: 'Failed to parse and compare VSR file.' });
  }
});

module.exports = router;
