/* eslint-env mocha */
const { assert } = require('chai')
const fetch = require('node-fetch')
const { pushStream } = require('./../src/index')

const ES_ENDPOINT = 'localhost:9200'
// 1. run a docker container
// docker run -i -p 9200:9200 --name my_elastic -p 9300:9300 -e "discovery.type=single-node" elasticsearch
describe('MODIFY event', () => {
  it('should create index', async () => {
    const simpleData = { index: 'test', type: 'test1', body: {test: 'test', myvalue: {1: 'test'}}, id: '12', endpoint: ES_ENDPOINT, testMode: true }
    await pushStream(simpleData)
    const result = await fetch(`http://${ES_ENDPOINT}/${simpleData.index}/${simpleData.type}/${simpleData.id}`)
    const body = await result.json()
    assert.deepEqual(simpleData.body, body._source)
  })
})
