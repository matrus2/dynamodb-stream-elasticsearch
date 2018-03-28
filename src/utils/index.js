module.exports = {
  removeEventData: (body) => {
    delete body.SequenceNumber
    delete body.SizeBytes
    delete body.StreamViewType
    return body
  }
}
