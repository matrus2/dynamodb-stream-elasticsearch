/* eslint-env mocha */
const { assert } = require('chai')
const fetch = require('node-fetch')
const { pushStream } = require('./../src/index')

async function assertThrowsAsync (fn, regExp) {
  let f = () => {}
  try {
    await fn()
  } catch (e) {
    f = () => { throw e }
  } finally {
    assert.throws(f, regExp)
  }
}

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
  it('wrong input index is not a string', async () => {
    const simpleData = { index: 12, type: 'test1', body: {test: 'test', myvalue: {1: 'test'}}, id: '12', endpoint: ES_ENDPOINT, testMode: true }
    await assertThrowsAsync(async () => pushStream(simpleData), 'Please provide correct index')
  })
  it('wrong input type is not a string', async () => {
    const simpleData = { index: 'asd', type: '', body: {test: 'test', myvalue: {1: 'test'}}, id: '12', endpoint: ES_ENDPOINT, testMode: true }
    await assertThrowsAsync(async () => pushStream(simpleData), 'Please provide correct type')
  })
  it('wrong input endpoint is not a string', async () => {
    const simpleData = { index: '12', type: 'test1', body: {test: 'test', myvalue: {1: 'test'}}, id: '12', testMode: true }
    await assertThrowsAsync(async () => pushStream(simpleData), 'Please provide correct endpoint')
  })
})
