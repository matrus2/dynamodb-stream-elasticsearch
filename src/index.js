const AWS = require('aws-sdk')
const converter = AWS.DynamoDB.Converter.unmarshall
const elastic = require('../utils/esWrapper')
const {removeEventData} = require('./../utils/index')

const validateParam = (param, paramName) => {
  if (!param || !(typeof param === 'string')) throw new Error(`Please provide correct ${paramName}`)
}

exports.pushStream = async ({event, index, type, endpoint, testMode = false} = {}) => {
  validateParam(index, 'index')
  validateParam(type, 'type')
  validateParam(endpoint, 'endpoint')

  const es = elastic(endpoint, testMode)

  event.Records.forEach((record) => {
    switch (record.eventName) {
      case 'REMOVE':

        break
      case 'MODIFY':
        const keys = converter(record.dynamodb.Keys)
        const id = Object.values(keys).reduce((acc, curr) => acc.concat(curr), '')
        let body = converter(record.dynamodb.NewImage)
        body = removeEventData(body)
        es.index({index, type, id, body})
        break
      case 'INSERT':

        break
    }
  })
}
