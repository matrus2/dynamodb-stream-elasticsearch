const elasticsearch = require('elasticsearch')
const httpAwsEs = require('http-aws-es')

/* CREATE THE CONNECTION TO ES */

module.exports = (hosts, testMode) => {
  const esParams = {hosts}
  if (!testMode) esParams.connectionClass = httpAwsEs
  const es = new elasticsearch.Client(esParams)
  return {
    index: ({index, type, id, body}) => new Promise((resolve, reject) => {
      es.index({index, type, id, body}, (error, response) => {
        if (error) reject(error)
        resolve(response)
      })
    }),
    remove: ({index, type, id}) => new Promise((resolve, reject) => {
      es.delete({index, type, id}, (error, response) => {
        if (error) reject(error)
        resolve(response)
      })
    })
  }
}
