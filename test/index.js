/* eslint-env mocha */
const { assert } = require('chai')
const fetch = require('node-fetch')
const AWS = require('aws-sdk')
const { pushStream } = require('./../src/index')
const elastic = require('../src/utils/es-wrapper')
const { sampleData, modifyEvent, removeEvent, insertEvent, multipleEvents } = require('./fixtures')
const { removeEventData } = require('../src/utils/index')
const getTableNameFromARN = require('../src/utils/table-name-from-arn')

const converter = AWS.DynamoDB.Converter.unmarshall
const INDEX = 'test'
const TYPE = 'test1'
const ES_ENDPOINT = 'localhost:9200'
const es = elastic(ES_ENDPOINT, true)

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

// 1. run a docker container
// docker run -i -p 9200:9200 --name my_elastic -p 9300:9300 -e "discovery.type=single-node" elasticsearch:7.2.0
describe('Test stream events', () => {
  beforeEach(async () => {
    const promiseArray = sampleData.map(
      data => es.index({ index: INDEX, type: TYPE, id: data.url, body: data }))
    await Promise.all(promiseArray).catch(e => { console.log(e) })
  })

  afterEach(async () => {
    await es.indicesDelete()
  })

  it('MODIFY: should modify existing item', async () => {
    await pushStream({ event: modifyEvent, index: INDEX, type: TYPE, endpoint: ES_ENDPOINT, testMode: true })
    const keys = converter(modifyEvent.Records[0].dynamodb.Keys)
    const result = await fetch(`http://${ES_ENDPOINT}/${INDEX}/${TYPE}/${keys.url}`)
    const body = await result.json()
    const data = removeEventData(converter(modifyEvent.Records[0].dynamodb.NewImage))
    assert.deepEqual(data, body._source)
  })

  it('REMOVE: should delete existing item', async () => {
    await pushStream({ event: removeEvent, index: INDEX, type: TYPE, endpoint: ES_ENDPOINT, testMode: true })
    const keys = converter(removeEvent.Records[0].dynamodb.Keys)
    const result = await fetch(`http://${ES_ENDPOINT}/${INDEX}/${TYPE}/${keys.url}`)
    const body = await result.json()
    assert.isFalse(body.found)
  })

  it('REMOVE: should not delete if item doen\'t exists', async () => {
    const event = removeEvent
    event.Records[0].dynamodb.Keys.url.S = 'something-which-doesnt-exists'
    await pushStream({ event, index: INDEX, type: TYPE, endpoint: ES_ENDPOINT, testMode: true })
    const keys = converter(removeEvent.Records[0].dynamodb.Keys)
    const result = await fetch(`http://${ES_ENDPOINT}/${INDEX}/${TYPE}/${keys.url}`)
    const body = await result.json()
    assert.isFalse(body.found)
  })

  it('INSERT: should insert new item', async () => {
    await pushStream({ event: insertEvent, index: INDEX, type: TYPE, endpoint: ES_ENDPOINT, testMode: true })
    const keys = converter(insertEvent.Records[0].dynamodb.Keys)
    const result = await fetch(`http://${ES_ENDPOINT}/${INDEX}/${TYPE}/${keys.url}`)
    const body = await result.json()
    assert.isTrue(body.found)
    const data = removeEventData(converter(insertEvent.Records[0].dynamodb.NewImage))
    assert.deepEqual(data, body._source)
  })

  it('INSERT: should insert new item when refresh false', async () => {
    await pushStream({
      event: insertEvent,
      index: INDEX,
      type: TYPE,
      endpoint: ES_ENDPOINT,
      refresh: false,
      testMode: true
    })
    const keys = converter(insertEvent.Records[0].dynamodb.Keys)
    const result = await fetch(`http://${ES_ENDPOINT}/${INDEX}/${TYPE}/${keys.url}`)
    const body = await result.json()
    assert.isTrue(body.found)
    const data = removeEventData(converter(insertEvent.Records[0].dynamodb.NewImage))
    assert.deepEqual(data, body._source)
  })

  it('INSERT: should insert new item based on ARN values', async () => {
    await pushStream({ event: insertEvent, endpoint: ES_ENDPOINT, testMode: true })
    const keys = converter(insertEvent.Records[0].dynamodb.Keys)
    const arnKey = getTableNameFromARN(insertEvent.Records[0].eventSourceARN)
    const result = await fetch(`http://${ES_ENDPOINT}/${arnKey}/${arnKey}/${keys.url}`)
    const body = await result.json()
    assert.isTrue(body.found)
    const data = removeEventData(converter(insertEvent.Records[0].dynamodb.NewImage))
    assert.deepEqual(data, body._source)
  })

  it('INSERT: should insert new item with new field by transform function', async () => {
    await pushStream({
      event: insertEvent,
      index: INDEX,
      type: TYPE,
      endpoint: ES_ENDPOINT,
      testMode: true,
      transformFunction: insertFullAddress
    })
    const keys = converter(insertEvent.Records[0].dynamodb.Keys)
    const result = await fetch(`http://${ES_ENDPOINT}/${INDEX}/${TYPE}/${keys.url}`)
    const body = await result.json()
    assert.isTrue(body.found)
    assert.property(body._source, 'full_address')
  })

  it('INSERT: should insert new item with new field from transform promise func', async () => {
    await pushStream({
      event: insertEvent,
      index: INDEX,
      type: TYPE,
      endpoint: ES_ENDPOINT,
      testMode: true,
      transformFunction: transformPromise(true)
    })
    const keys = converter(insertEvent.Records[0].dynamodb.Keys)
    const result = await fetch(`http://${ES_ENDPOINT}/${INDEX}/${TYPE}/${keys.url}`)
    const body = await result.json()
    assert.isTrue(body.found)
    assert.property(body._source, 'foo')
    assert.equal(body._source.foo, 'bar')
  })

  it('INSERT: should insert new item with new field from transform promise func', async () => {
    await pushStream({
      event: insertEvent,
      index: INDEX,
      type: TYPE,
      endpoint: ES_ENDPOINT,
      testMode: true,
      transformFunction: transformPromiseTimeout(true)
    })
    const keys = converter(insertEvent.Records[0].dynamodb.Keys)
    const result = await fetch(`http://${ES_ENDPOINT}/${INDEX}/${TYPE}/${keys.url}`)
    const body = await result.json()
    assert.isTrue(body.found)
    assert.property(body._source, 'foo')
    assert.equal(body._source.foo, 'bar')
  })

  it('INSERT: should throw if promise rejected', async () => {
    const simpleData = {
      event: insertEvent,
      index: INDEX,
      type: TYPE,
      endpoint: ES_ENDPOINT,
      testMode: true,
      transformFunction: transformPromise(false)
    }
    await assertThrowsAsync(async () => pushStream(simpleData), 'Your error')
  })

  it('INSERT: should insert new item without new field', async () => {
    await pushStream({
      event: insertEvent,
      index: INDEX,
      type: TYPE,
      endpoint: ES_ENDPOINT,
      testMode: true,
      transformFunction: undefined
    })
    const keys = converter(insertEvent.Records[0].dynamodb.Keys)
    const result = await fetch(`http://${ES_ENDPOINT}/${INDEX}/${TYPE}/${keys.url}`)
    const body = await result.json()
    assert.isTrue(body.found)
    const data = removeEventData(converter(insertEvent.Records[0].dynamodb.NewImage))
    assert.deepEqual(data, body._source)
  })

  it('Multiple events: insert, remove, modify', async () => {
    await pushStream({ event: multipleEvents, index: INDEX, type: TYPE, endpoint: ES_ENDPOINT, testMode: true })
    const removed = converter(multipleEvents.Records[2].dynamodb.Keys).url
    const inserted = converter(multipleEvents.Records[0].dynamodb.Keys).url
    const changed = converter(multipleEvents.Records[1].dynamodb.Keys).url
    // REMOVED
    let result = await fetch(`http://${ES_ENDPOINT}/${INDEX}/${TYPE}/${removed}`)
    let body = await result.json()
    assert.isFalse(body.found)
    // INSERTED
    result = await fetch(`http://${ES_ENDPOINT}/${INDEX}/${TYPE}/${inserted}`)
    body = await result.json()
    assert.isTrue(body.found)
    // CHANGED
    result = await fetch(`http://${ES_ENDPOINT}/${INDEX}/${TYPE}/${changed}`)
    body = await result.json()
    const data = removeEventData(converter(multipleEvents.Records[1].dynamodb.NewImage))
    assert.deepEqual(data, body._source)
  })

  it('Multiple events: insert, remove, modify with refresh false', async () => {
    await pushStream({
      event: multipleEvents,
      index: INDEX,
      type: TYPE,
      endpoint: ES_ENDPOINT,
      testMode: true,
      refresh: false
    })
    const removed = converter(multipleEvents.Records[2].dynamodb.Keys).url
    const inserted = converter(multipleEvents.Records[0].dynamodb.Keys).url
    const changed = converter(multipleEvents.Records[1].dynamodb.Keys).url
    // REMOVED
    let result = await fetch(`http://${ES_ENDPOINT}/${INDEX}/${TYPE}/${removed}`)
    let body = await result.json()
    assert.isFalse(body.found)
    // INSERTED
    result = await fetch(`http://${ES_ENDPOINT}/${INDEX}/${TYPE}/${inserted}`)
    body = await result.json()
    assert.isTrue(body.found)
    // CHANGED
    result = await fetch(`http://${ES_ENDPOINT}/${INDEX}/${TYPE}/${changed}`)
    body = await result.json()
    const data = removeEventData(converter(multipleEvents.Records[1].dynamodb.NewImage))
    assert.deepEqual(data, body._source)
  })

  it('Input data: wrong index is not a string', async () => {
    const simpleData = {
      index: 12,
      type: 'test1',
      body: { test: 'test', myvalue: { 1: 'test' } },
      id: '12',
      endpoint: ES_ENDPOINT,
      testMode: true
    }
    await assertThrowsAsync(async () => pushStream(simpleData), 'Please provide correct value for index')
  })

  it('Input data: wrong type is not a string', async () => {
    const simpleData = {
      index: 'asd',
      type: 1,
      body: { test: 'test', myvalue: { 1: 'test' } },
      id: '12',
      endpoint: ES_ENDPOINT,
      testMode: true
    }
    await assertThrowsAsync(async () => pushStream(simpleData), 'Please provide correct value for type')
  })

  it('Input data: wrong endpoint is not a string', async () => {
    const simpleData = {
      index: '12',
      type: 'test1',
      body: { test: 'test', myvalue: { 1: 'test' } },
      id: '12',
      testMode: true
    }
    await assertThrowsAsync(async () => pushStream(simpleData), 'Please provide correct value for endpoint')
  })

  it('Input data: wrong refresh is not a boolean', async () => {
    const simpleData = {
      index: 'asd',
      type: 'asd',
      body: { test: 'test', myvalue: { 1: 'test' } },
      id: '12',
      endpoint: ES_ENDPOINT,
      refresh: 'true',
      testMode: true
    }
    await assertThrowsAsync(async () => pushStream(simpleData), 'Please provide correct value for refresh')
  })

  it('Input data: wrong transform function', async () => {
    const simpleData = {
      index: 'asd',
      type: 'asd',
      body: { test: 'test', myvalue: { 1: 'test' } },
      id: '12',
      endpoint: ES_ENDPOINT,
      refresh: true,
      testMode: true,
      transformFunction: null
    }
    await assertThrowsAsync(async () => pushStream(simpleData), 'Please provide correct value for transformFunction')
  })

  it('INSERT: should insert new item based on elasticSearchOptions ', async () => {
    await pushStream({
      event: insertEvent,
      index: INDEX,
      type: TYPE,
      endpoint: 'tobeoverwritten',
      testMode: true,
      transformFunction: undefined,
      elasticSearchOptions: { hosts: 'localhost:9200' }
    })
    const keys = converter(insertEvent.Records[0].dynamodb.Keys)
    const result = await fetch(`http://${ES_ENDPOINT}/${INDEX}/${TYPE}/${keys.url}`)
    const body = await result.json()
    assert.isTrue(body.found)
    const data = removeEventData(converter(insertEvent.Records[0].dynamodb.NewImage))
    assert.deepEqual(data, body._source)
  })
})

function insertFullAddress (record) {
  const hydratedRecord = JSON.parse(JSON.stringify(record))
  hydratedRecord.full_address = getFieldContent(record.city, '. ') + getFieldContent(record.country + '.')
  return hydratedRecord
}

const getFieldContent = (content, sep = ' ') => {
  return content ? content + sep : ''
}

const transformPromise = (resolved) => (record) => new Promise((resolve, reject) => {
  if (resolved) {
    resolve({ ...record, foo: 'bar' })
  }
  reject(new Error('Your error'))
})

const transformPromiseTimeout = (resolved) => (record) => new Promise((resolve, reject) => {
  setTimeout(() => {
    if (resolved) {
      resolve({ ...record, foo: 'bar' })
    }
    reject(new Error('Your error'))
  }, 1000)
})
