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
const validateFunctionOrUndefined = (param, paramName) => {
  if (!(typeof param === 'undefined' || typeof param === 'function')) throw new Error(`Please provide correct value for ${paramName}`)
}

exports.pushStream = async (
  {
    event,
    index = getTableNameFromARN(event.Records[0].eventSourceARN),
    type = getTableNameFromARN(event.Records[0].eventSourceARN),
    endpoint,
    refresh = true,
    testMode = false,
    transformFunction = undefined,
    elasticSearchOptions
  } = {}) => {
  validateString(index, 'index')
  validateString(type, 'type')
  validateString(endpoint, 'endpoint')
  validateBoolean(refresh, 'refresh')
  validateFunctionOrUndefined(transformFunction, 'transformFunction')

  const es = elastic(endpoint, testMode, elasticSearchOptions)

  for (const record of event.Records) {
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
        const oldBody = record.dynamodb.OldImage ? converter(record.dynamodb.OldImage) : undefined
        body = removeEventData(body)
        if (transformFunction) {
          body = await Promise.resolve(transformFunction(body, oldBody))
        }
        try {
          if (
            body &&
            (Object.keys(body).length !== 0 && body.constructor === Object)
          ) {
            await es.index({ index, type, id, body, refresh });
          }
        } catch (e) {
          throw new Error(e)
        }
        break
      }
      default:
        throw new Error(record.eventName + ' wasn\'t recognized')
    }
  }
}
