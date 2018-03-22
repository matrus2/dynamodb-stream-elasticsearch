const elasticsearch = require('elasticsearch')
const httpAwsEs = require('http-aws-es')

exports.pushStream = async ({index, type, id, body, endpoint, refresh = true, testMode = false} = {}) => {
  // Data validation
  if (!index || !(typeof index === 'string')) throw new Error('Please provide correct index')
  if (!type || !(typeof type === 'string')) throw new Error('Please provide correct type')
  if (!endpoint || !(typeof endpoint === 'string')) throw new Error('Please provide correct endpoint')

  /* CREATE THE CONNECTION TO ES */
  let connParams = {hosts: endpoint}
  // AWS Elasticsearch requires special type of connection, in CI we will use plain elasticsearch container
  if (!testMode) connParams.connectionClass = httpAwsEs
  const es = new elasticsearch.Client(connParams)

  es.index({index, type, id, body, refresh}, (error, response) => {
    if (error) console.log(error)
    console.log(response)
  })
}
