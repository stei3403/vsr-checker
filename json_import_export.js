const AWS = require('aws-sdk');

AWS.config.update({ region: 'us-east-2' }); // Change to your region

const dynamoDB = new AWS.DynamoDB.DocumentClient();

const SOURCE_TABLE = 'MasterSWList';
const DEST_TABLE = 'MasterSWList2';

async function scanTable(lastEvaluatedKey) {
  const params = {
    TableName: SOURCE_TABLE,
    ExclusiveStartKey: lastEvaluatedKey
  };

  const data = await dynamoDB.scan(params).promise();
  return data;
}

async function batchWrite(items) {
  const chunks = [];
  for (let i = 0; i < items.length; i += 25) {
    chunks.push(items.slice(i, i + 25));
  }

  for (const chunk of chunks) {
    const writeParams = {
      RequestItems: {
        [DEST_TABLE]: chunk.map(item => ({
          PutRequest: { Item: item }
        }))
      }
    };

    await dynamoDB.batchWrite(writeParams).promise();
  }
}

(async () => {
  let lastEvaluatedKey = null;
  let totalCopied = 0;

  do {
    const data = await scanTable(lastEvaluatedKey);
    await batchWrite(data.Items);
    totalCopied += data.Items.length;
    lastEvaluatedKey = data.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`✅ Copied ${totalCopied} items from ${SOURCE_TABLE} to ${DEST_TABLE}`);
})();
