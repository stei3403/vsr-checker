// Load AWS SDK and environment variables
const AWS = require('aws-sdk');
require('dotenv').config();

const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  DYNAMO_TABLE_NAME,
} = process.env;

// Configure AWS SDK
AWS.config.update({
  region: AWS_REGION,
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
});

// Create DynamoDB DocumentClient
const dynamodb = new AWS.DynamoDB.DocumentClient();

/**
 * Get all items from the MasterSWList table
 */
async function getAllItems(tableName = DYNAMO_TABLE_NAME) {
  const params = { TableName: tableName };


  try {
    const data = await dynamodb.scan(params).promise();

    const cleaned = data.Items.map(item => ({
      ECU: item.ECU || '',
      PartNum: item.PartNum || '',
      SWVersion: item.SWVersion || '',
      Priority: typeof item.Priority === 'number'
        ? item.Priority
        : parseInt(item.Priority) || 0,
      FIOwner: item.FIOwner || '',
      SubsystemOwner: item.SubsystemOwner || ''
    }));

    return cleaned;
  } catch (err) {
    console.error('DynamoDB Scan Error:', err);
    throw err;
  }
}

/**
 * Insert or overwrite a single ECU record
 */
async function putItem(item) {
  const params = {
    TableName: DYNAMO_TABLE_NAME,
    Item: item,
  };

  try {
    await dynamodb.put(params).promise();
    return true;
  } catch (err) {
    console.error('DynamoDB Put Error:', err);
    throw err;
  }
}

/**
 * Delete a record by ECU
 */
async function deleteItem(ecu) {
  const params = {
    TableName: DYNAMO_TABLE_NAME,
    Key: {
      ECU: ecu,
    },
  };

  try {
    await dynamodb.delete(params).promise();
    return true;
  } catch (err) {
    console.error('DynamoDB Delete Error:', err);
    throw err;
  }
}

/**
 * Update specific fields for a given ECU record
 */
async function updateItem(item, tableName = DYNAMO_TABLE_NAME) {
  const { ECU, PartNum, SWVersion, Priority, FIOwner, SubsystemOwner } = item;

  if (!ECU) {
    console.warn('⚠️ No ECU provided — skipping update.');
    return false;
  }

  const getParams = {
    TableName: tableName,
    Key: { ECU },
  };

  try {
    // Check if the item exists
    const existing = await dynamodb.get(getParams).promise();

    if (!existing.Item) {
      // Item doesn't exist → insert new
      const putParams = {
        TableName: tableName,
        Item: {
          ECU,
          PartNum: PartNum || '',
          SWVersion: SWVersion || '',
          Priority: typeof Priority === 'number' ? Priority : parseInt(Priority) || 0,
          FIOwner: FIOwner || '',
          SubsystemOwner: SubsystemOwner || '',
        },
      };

      await dynamodb.put(putParams).promise();
      console.log(`🆕 Inserted new ECU: ${ECU}`);
      return true;
    }

    // Otherwise → perform update
    const fields = [];
    const values = {};

    if (PartNum !== undefined) {
      fields.push("PartNum = :pn");
      values[":pn"] = PartNum;
    }
    if (SWVersion !== undefined) {
      fields.push("SWVersion = :sw");
      values[":sw"] = SWVersion;
    }
    if (Priority !== undefined) {
      const parsedPriority = typeof Priority === 'number' ? Priority : parseInt(Priority) || 0;
      fields.push("Priority = :pri");
      values[":pri"] = parsedPriority;
    }
    if (FIOwner !== undefined) {
      fields.push("FIOwner = :fi");
      values[":fi"] = FIOwner;
    }
    if (SubsystemOwner !== undefined) {
      fields.push("SubsystemOwner = :sub");
      values[":sub"] = SubsystemOwner;
    }

    if (fields.length === 0) {
      console.warn(`⚠️ No updatable fields provided for ECU: ${ECU}`);
      return false;
    }

    const updateParams = {
      TableName: tableName,
      Key: { ECU },
      UpdateExpression: `SET ${fields.join(", ")}`,
      ExpressionAttributeValues: values,
      ReturnValues: 'UPDATED_NEW'
    };

    await dynamodb.update(updateParams).promise();
    console.log(`✅ Updated ECU: ${ECU}`);
    return true;

  } catch (err) {
    console.error(`❌ Failed to update/insert ECU: ${ECU}`, err);
    throw err;
  }
}

module.exports = {
  getAllItems,
  putItem,
  deleteItem,
  updateItem,
};
