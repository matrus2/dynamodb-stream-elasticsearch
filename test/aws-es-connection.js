/* eslint-env mocha */
const { createAWSConnection, awsGetCredentials } = require('../src/utils/aws-es-connection')
const AWS = require('aws-sdk')
const { Client } = require('@elastic/elasticsearch')
const chai = require('chai')
const { assert, expect } = chai
const spies = require('chai-spies')
chai.use(spies)

describe('aws-es-connection', () => {
  let esClient
  let indexPrefix

  before(async () => {
    const esEndpoint = process.env.AWS_ES_ENDPOINT
    if (!esEndpoint) {
      throw new Error(
        'AWS_ES_ENDPOINT ENV not set. Make sure the env is set to a real AWS ES endpoint (or a localstack on http://localhost:4571) and that you have AWS credentials set.'
      )
    }


    // Try make an API call to check credentials are good
    try {
      await new AWS.ES({ region: 'us-east-1', endpoint: 'http://localhost:4566', credentials: { secretAccessKey: 'test', accessKeyId: 'test' } }).listElasticsearchVersions().promise()
    } catch (err) {
      console.error(err)
      throw new Error('Failed to make an call to the AWS API. Check your AWS credentials are set and valid.')
    }

    const awsEsConnection = createAWSConnection(await awsGetCredentials())
    esClient = new Client({
      ...awsEsConnection,
      node: esEndpoint
    })

    indexPrefix = `aws-es-connection-tests-${new Date().getTime()}`
  })

  it('aws creds are retrieved before each async call', async () => {
    const spy = chai.spy.on(AWS.config.credentials, 'getPromise')
    await esClient.cat.health()
    expect(spy).to.have.been.called()
  })

  it('aws creds are retrieved before each callback call', done => {
    const spy = chai.spy.on(AWS.config.credentials, 'get')

    esClient.cat.health(() => {
      try {
        expect(spy).to.have.been.called()
        done()
      } catch (err) {
        done(err)
      }
    })
  })

  it('indices async', async () => {
    const indexName = indexPrefix + '-indices-async'
    try {
      // Create and retrieve index
      await esClient.indices.create({ index: indexName })
      const index = await esClient.indices.get({ index: indexName })
      assert.hasAnyKeys(index.body, indexName)
    } finally {
      // Delete index
      await esClient.indices.delete({ index: indexName })
    }
  })

  it('indices callback', done => {
    const indexName = indexPrefix + '-indices-callback'

    const cleanUp = callback => {
      esClient.indices.delete({ index: indexName }, callback)
    }

    // Create and retrieve index
    esClient.indices.create({ index: indexName }, err => {
      if (err) {
        cleanUp(() => done(err))
      }
      esClient.indices.get({ index: indexName }, (err, index) => {
        if (err) {
          cleanUp(() => done(err))
        }
        try {
          assert.hasAnyKeys(index.body, indexName)
          cleanUp(err => done(err))
        } catch (err) {
          return cleanUp(() => done(err))
        }
      })
    })
  })

  it('indexing and searching', async () => {
    const indexName = indexPrefix + '-searching'
    const doc1 = { name: 'John', body: 'Hello world' }
    const doc2 = { name: 'Joe', body: 'Lorem ipsum' }
    const doc3 = { name: 'Abbie', body: 'Hello, look at this' }

    try {
      // Create index and index some docs
      await esClient.indices.create({ index: indexName })
      await Promise.all([
        esClient.index({ index: indexName, refresh: 'wait_for', body: doc1 }),
        esClient.index({ index: indexName, refresh: 'wait_for', body: doc2 }),
        esClient.index({ index: indexName, refresh: 'wait_for', body: doc3 })
      ])

      const result = await esClient.search({ index: indexName, q: 'Hello' })
      assert.equal(result.body.hits.total.value, 2)
    } finally {
      // Clean up
      await esClient.indices.delete({ index: indexName })
    }
  }, 10000)
})
