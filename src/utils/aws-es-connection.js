const { config } = require('aws-sdk/global')
const { request, Agent } = require('http')
const { sign } = require('aws4')
const { Connection, Transport } = require('@elastic/elasticsearch')

function generateAWSConnectionClass (credentials, keepAlive) {
  return class AWSConnection extends Connection {
    constructor (opts) {
      super(opts)
      this.makeRequest = this.signedRequest
    }

    signedRequest (reqParams) {
      const httpAgent = new Agent({ keepAlive: keepAlive })
      return request(sign({ ...reqParams, agent: httpAgent, service: 'es' }, credentials))
    }
  }
}

function generateAWSTransportClass (credentials) {
  return class AWSTransport extends Transport {
    request (params, options, callback = undefined) {
      if (typeof options === 'function') {
        callback = options
        options = {}
      }
      if (typeof params === 'function' || params == null) {
        callback = params
        params = {}
        options = {}
      }
      // Wrap promise API
      const isPromiseCall = typeof callback !== 'function'
      if (isPromiseCall) {
        return credentials.getPromise().then(() => super.request(params, options, callback))
      }

      // Wrap callback API
      credentials.get(err => {
        if (err) {
          callback(err, null)
          return
        }

        console.log({ params, options, callback })
        return super.request(params, options, callback)
      })
    }
  }
}

const createAWSConnection = (awsCredentials, keepAlive) => ({
  Connection: generateAWSConnectionClass(awsCredentials, keepAlive),
  Transport: generateAWSTransportClass(awsCredentials)
})

const awsGetCredentials = () => {
  return new Promise((resolve, reject) => {
    config.getCredentials(err => {
      if (err) {
        return reject(err)
      }

      resolve(config.credentials)
    })
  })
}

module.exports = { createAWSConnection, awsGetCredentials }
