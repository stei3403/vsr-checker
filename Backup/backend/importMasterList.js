const xlsx = require('xlsx');
const path = require('path');
const { putItem } = require('./services/dynamoClient');

// Path to your Excel file
const filePath = path.join(__dirname, '../Master_SW_List.xlsx');

// Read the Excel file
const workbook = xlsx.readFile(filePath);
const sheet = workbook.Sheets['Master SW List'];
const data = xlsx.utils.sheet_to_json(sheet);

// Loop and push each row to DynamoDB
(async () => {
  for (const row of data) {
    if (!row.ECU || !row['Part #']) {
      console.warn('Skipping row with missing ECU or Part #:', row);
      continue;
    }

    const item = {
      ECU: row.ECU,
      PartNum: row['Part #'],
      SWVersion: row['SW Version'] || 'N/A',
      Priority: typeof row.Priority === 'number' ? row.Priority : 0,
      FIOwner: row['FI Owner'] || 'N/A',
      SubsystemOwner: row['Subsystem Owner'] || 'N/A'
    };

    try {
      await putItem(item);
      console.log(`✅ Inserted: ${item.ECU}`);
    } catch (err) {
      console.error(`❌ Failed: ${item.ECU}`, err);
    }
  }

  console.log('✅ Import complete.');
})();
