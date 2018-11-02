const AWS = require('aws-sdk')
const converter = AWS.DynamoDB.Converter.unmarshall
const elastic = require('./utils/es-wrapper')
const getTableNameFromARN = require('./utils/table-name-from-arn')
const { removeEventData } = require('./utils/index')

const validateString = (param, paramName) => {
  if (!param || !(typeof param === 'string')) throw new Error(`Please provide correct value for ${paramName}`)
}
const validateBoolean = (param, paramName) => {
  if (!(typeof param === 'boolean')) throw new Error(`Please provide correct value for ${paramName}`)
}

exports.pushStream = async (
  {
    event,
    index = getTableNameFromARN(event.Records[0].eventSourceARN),
    type = getTableNameFromARN(event.Records[0].eventSourceARN),
    endpoint,
    refresh = true,
    testMode = false
  } = {}) => {
  validateString(index, 'index')
  validateString(type, 'type')
  validateString(endpoint, 'endpoint')
  validateBoolean(refresh, 'refresh')

  const es = elastic(endpoint, testMode)

  event.Records.forEach(async (record) => {
    const keys = converter(record.dynamodb.Keys)
    const id = Object.values(keys).reduce((acc, curr) => acc.concat(curr), '')

    switch (record.eventName) {
      case 'REMOVE': {
        try {
          if (await es.exists({ index, type, id, refresh })) {
            await es.remove({ index, type, id, refresh })
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
          await es.index({ index, type, id, body, refresh })
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
