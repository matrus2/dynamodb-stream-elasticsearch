const { Client } = require('@elastic/elasticsearch')
const { createAWSConnection, awsGetCredentials } = require('./aws-es-connection')

module.exports = async (node, options, keepAlive) => {
  const esParams = { node }
  let AWSConnection = {}

  const awsCredentials = await awsGetCredentials()
  AWSConnection = createAWSConnection(awsCredentials, keepAlive)

  const es = new Client({
    ...AWSConnection,
    ...esParams,
    ...options
  })

  return {
    index: ({ index, id, body, refresh }) => es.index({ index, id, body, refresh, timeout: '5m' }),
    remove: ({ index, id, refresh }) => es.delete({ index, id, refresh }),
    exists: ({ index, id, refresh }) => es.exists({ index, id, refresh }),
    indicesDelete: (index = '_all') => es.indices.delete({ index }),
    bulk: ({ refresh = true, body }) => es.bulk({ refresh, body })
  }
}
