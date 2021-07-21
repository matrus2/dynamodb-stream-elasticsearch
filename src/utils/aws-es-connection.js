const { config } = require('aws-sdk/global')
const { request } = require('http')
const { sign } = require('aws4')
const { Connection, Transport } = require('@elastic/elasticsearch')

function generateAWSConnectionClass (credentials) {
  return class AWSConnection extends Connection {
    constructor (opts) {
      super(opts)
      this.makeRequest = this.signedRequest
    }

    signedRequest (reqParams) {
      return request(sign({ ...reqParams, service: 'es' }, credentials))
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

const createAWSConnection = awsCredentials => ({
  Connection: generateAWSConnectionClass(awsCredentials),
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
