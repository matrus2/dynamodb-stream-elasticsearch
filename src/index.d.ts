import { ClientOptions } from "@elastic/elasticsearch";
import { DynamoDBStreamEvent, DynamoDBRecord  } from 'aws-lambda';
import { AttributeMap } from "aws-sdk/clients/dynamodbstreams";

export function pushStream(opts: streamOptions): Promise<void>

export type transformFunction = (body?: { [key: string]: any }, oldBody?: AttributeMap, record?: DynamoDBRecord) => Promise<any> | any

export interface streamOptions {
    event: DynamoDBStreamEvent,
    index?: string,
    type?: string,
    endpoint: string,
    refresh?: boolean,
    transformFunction?: transformFunction,
    elasticSearchOptions?: ClientOptions,
    useBulk?: boolean
}
