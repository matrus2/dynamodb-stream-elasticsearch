/*
  MODIFY
*/
const modifyEvent = {
  Records: [
    {
      eventID: '89b9b96fe443b7f4869f46d773c9ef29',
      eventName: 'MODIFY',
      eventVersion: '1.1',
      eventSource: 'aws:dynamodb',
      awsRegion: 'us-east-1',
      dynamodb: {
        ApproximateCreationDateTime: 1521459360,
        Keys: {
          url: {
            S: 'russ-wintheiser-c240e6ac-3',
          },
        },
        NewImage: {
          country: {
            S: 'US',
          },
          addedDate: {
            N: '1518102681654',
          },
          city: {
            S: 'Aric view',
          },
          company_id: {
            N: '3',
          },
          url: {
            S: 'russ-wintheiser-c240e6ac-3',
          },
          name: {
            S: 'russ wintheiser',
          },
          SequenceNumber: '214655900000000005192458861',
          SizeBytes: 16438,
          StreamViewType: 'NEW_IMAGE',
        },
        eventSourceARN:
          'arn:aws:dynamodb:us-east-1:945413996076:table/Candidates/stream/2018-02-26T13:30:22.250',
      },
    },
  ],
};

/*
 REMOVE
*/
const removeEvent = {
  Records: [
    {
      eventID: 'f5bc169d16b5f3de6f8b3c3d7634c119',
      eventName: 'REMOVE',
      eventVersion: '1.1',
      eventSource: 'aws:dynamodb',
      awsRegion: 'us-east-1',
      dynamodb: {
        ApproximateCreationDateTime: 1521459420,
        Keys: {
          url: {
            S: 'russ-wintheiser-c240e6ac-3',
          },
        },
        SequenceNumber: '214656000000000005192482400',
        SizeBytes: 29,
        StreamViewType: 'NEW_IMAGE',
      },
      eventSourceARN:
        'arn:aws:dynamodb:us-east-1:945413996076:table/Candidates/stream/2018-02-26T13:30:22.250',
    },
  ],
};

/*
  INSERT
*/
const insertEvent = {
  Records: [
    {
      eventID: 'f41d65c5ba9a67153994d2122275b05f',
      eventName: 'INSERT',
      eventVersion: '1.1',
      eventSource: 'aws:dynamodb',
      awsRegion: 'us-east-1',
      dynamodb: {
        ApproximateCreationDateTime: 1521459420,
        Keys: {
          url: {
            S: 'kale-pasros-253b536b-1',
          },
        },
        NewImage: {
          country: {
            S: 'US',
          },
          addedDate: {
            N: '1518103840119',
          },
          city: {
            S: 'New Shann',
          },
          company_id: {
            N: '1',
          },
          url: {
            S: 'kale-pasros-253b536b-1',
          },
          name: {
            S: 'kale pouros',
          },
        },
        SequenceNumber: '214656100000000005192507033',
        SizeBytes: 16430,
        StreamViewType: 'NEW_IMAGE',
      },
      eventSourceARN:
        'arn:aws:dynamodb:us-east-1:945413996076:table/Candidates/stream/2018-02-26T13:30:22.250',
    },
    {
      eventID: 'cf8e1aaa7a284cdb0ce2a6f8c9aa4da7',
      eventName: 'MODIFY',
      eventVersion: '1.1',
      eventSource: 'aws:dynamodb',
      awsRegion: 'us-east-1',
      dynamodb: {
        ApproximateCreationDateTime: 1521460560,
        Keys: {
          url: {
            S: 'kale-pasros-253b536b-1',
          },
        },
        NewImage: {
          country: {
            S: 'US',
          },
          addedDate: {
            N: '1518101840119',
          },
          city: {
            S: 'New Shann',
          },
          company_id: {
            N: '1',
          },
          url: {
            S: 'kale-pasros-253b536b-1',
          },
          name: {
            S: 'kale pouros',
          },
        },
        SequenceNumber: '214656200000000005193360757',
        SizeBytes: 16430,
        StreamViewType: 'NEW_IMAGE',
      },
      eventSourceARN:
        'arn:aws:dynamodb:us-east-1:945413996076:table/Candidates/stream/2018-02-26T13:30:22.250',
    },
  ],
};
