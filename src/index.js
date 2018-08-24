const AWS = require('aws-sdk')
const converter = AWS.DynamoDB.Converter.unmarshall
const elastic = require('./utils/es-wrapper')
const getTableFromARN = require('./utils/table-from-arn')
const {removeEventData} = require('./utils/index')

const validateParam = (param, paramName) => {
  if (!param || !(typeof param === 'string')) throw new Error(`Please provide correct ${paramName}`)
}

exports.pushStream = async ({event, index, type, refresh = true, endpoint, testMode = false} = {}) => {
  // validateParam(index, 'index')
  // validateParam(type, 'type')
  validateParam(endpoint, 'endpoint')

  const es = elastic(endpoint, testMode)

  event.Records.forEach(async (record) => {
    const keys = converter(record.dynamodb.Keys)
    const id = Object.values(keys).reduce((acc, curr) => acc.concat(curr), '')
    const tableName = getTableFromARN(record.eventSourceARN).toLowerCase()

    // If index is invalid insert tableName
    let finalIndex = index || tableName;
    // If type is invalid insert index or tableName
    let finalType = type || finalIndex;

    switch (record.eventName) {
      case 'REMOVE': {
        try {
          if (await es.exists({finalIndex, finalType, id, refresh})) {
            await es.remove({finalIndex, finalType, id, refresh})
          }
        } catch (e) {
          throw new Error(e)
        }
        break
      }
      case 'MODIFY':
      case 'INSERT': {
        let body = converter(record.dynamodb.NewImage)
        body = removeEventData(body)
        try {
          await es.index({finalIndex, finalType, id, body, refresh})
        } catch (e) {
          throw new Error(e)
        }
        break
      }
      default:
        throw new Error(record.eventName + ' wasn\'t recognized')
    }
  })
}
