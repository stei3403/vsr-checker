const xlsx = require('xlsx');
const path = require('path');
const { putItem } = require('./services/dynamoClient');

console.log("📥 Import script started...");

// Path to Excel file
const filePath = path.join(__dirname, '../Master_SW_List.xlsx');

// Read the Excel file
const workbook = xlsx.readFile(filePath);
const sheet = workbook.Sheets['Master SW List'];
const data = xlsx.utils.sheet_to_json(sheet);

// Keep track of seen ECUs to avoid overwrites
const seen = new Set();

(async () => {
  for (const row of data) {
    if (!row.ECU || !row['Part #']) {
      console.warn('⚠️ Skipping row with missing ECU or Part #:', row);
      continue;
    }

    const ecu = row.ECU.trim();

    if (seen.has(ecu)) {
      console.warn(`⚠️ Duplicate ECU "${ecu}" found. Skipping.`);
      continue;
    }

    seen.add(ecu);

    const item = {
      ECU: ecu,
      ExpectedPartNum: row['Part #'].trim(),
      ExpectedSW: row['SW Version']?.trim() || 'N/A',
      Priority: typeof row.Priority === 'number' ? row.Priority : parseInt(row.Priority) || 0,
      FIOwner: row['FI Owner']?.trim() || 'N/A',
      SubsystemOwner: row['Subsystem Owner']?.trim() || 'N/A'
    };

    try {
      await putItem(item);
      console.log(`✅ Inserted: ${ecu}`);
    } catch (err) {
      console.error(`❌ Failed to insert ${ecu}:`, err);
    }
  }

  console.log('✅ Import complete.');
})();
