const AWS = require('aws-sdk');
require('dotenv').config();

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;

AWS.config.update({
  region: AWS_REGION,
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

// Original table you're using for KX
const sourceTable = 'MasterSWList2';

// Tables you want to copy the data into
const targetTables = ['MasterList_KX', 'MasterList_WS_REPB', 'MasterList_DT_REPB', 'MasterList_WL'];

async function cloneTable() {
  try {
    const data = await dynamodb.scan({ TableName: sourceTable }).promise();
    const items = data.Items;

    if (!items || items.length === 0) {
      console.warn(`⚠️ No items found in source table: ${sourceTable}`);
      return;
    }

    for (const targetTable of targetTables) {
      console.log(`🚀 Cloning into ${targetTable}...`);
      for (const item of items) {
        const putParams = {
          TableName: targetTable,
          Item: { ...item },
        };
        await dynamodb.put(putParams).promise();
        console.log(`✅ Copied ${item.ECU} to ${targetTable}`);
      }
    }

    console.log(`🎉 All done. Copied ${items.length} items to each of ${targetTables.length} tables.`);
  } catch (err) {
    console.error('❌ Error cloning table:', err);
  }
}

cloneTable();
