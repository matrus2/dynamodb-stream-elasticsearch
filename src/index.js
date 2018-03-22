const AWS = require('aws-sdk')
const converter = AWS.DynamoDB.Converter.unmarshall
const elastic = require('./esWrapper')

exports.pushStream = async ({event, index, type, id, body, endpoint, testMode = false} = {}) => {
  // Data validation
  if (!index || !(typeof index === 'string')) throw new Error('Please provide correct index')
  if (!type || !(typeof type === 'string')) throw new Error('Please provide correct type')
  if (!endpoint || !(typeof endpoint === 'string')) throw new Error('Please provide correct endpoint')

  const es = elastic(endpoint, testMode)

  event.Records.forEach((record) => {
    switch (record.eventName) {
      case 'REMOVE':

        break
      case 'MODIFY':

        break
      case 'INSERT':

        break
    }
  })
}
