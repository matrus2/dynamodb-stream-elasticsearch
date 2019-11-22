const { Client } = require('@elastic/elasticsearch')
const { createAWSConnection, awsGetCredentials } = require('@acuris/aws-es-connection')

module.exports = async (node, testMode, options) => {

  const esParams = { node }
  // Because we use ordinary elasticsearch container instead of AWS elasticsearch for integration tests
  // then if endpoint is localhost we cannot upload aws credentials
  if (!testMode && node.indexOf('localhost') === -1) {
    const awsCredentials = await awsGetCredentials()
    const AWSConnection = createAWSConnection(awsCredentials)
    esParams.Connection = AWSConnection
  }

  const es = new Client({
    ...esParams,
    ...options
  })

  return {
    index: ({ index, type, id, body, refresh }) => new Promise((resolve, reject) => {
      es.index({ index, type, id, body, refresh, timeout: '5m' }, (error, response) => {
        if (error) reject(error)
        resolve(response)
      })
    }),
    remove: ({ index, type, id, refresh }) => new Promise((resolve, reject) => {
      es.delete({ index, type, id, refresh }, (error, response) => {
        if (error) reject(error)
        resolve(response)
      })
    }),
    exists: ({ index, type, id, refresh }) => new Promise((resolve, reject) => {
      es.exists({ index, type, id, refresh }, (error, response) => {
        if (error) reject(error)
        resolve(response)
      })
    }),
    indicesDelete: (index = '_all') => new Promise((resolve, reject) => {
      es.indices.delete({ index }, (error, response) => {
        if (error) reject(error)
        resolve(response)
      })
    })
  }
}
