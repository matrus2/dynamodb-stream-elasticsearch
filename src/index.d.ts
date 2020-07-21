import { ClientOptions } from "@elastic/elasticsearch";
import { RecordList, Record, AttributeMap } from "aws-sdk/clients/dynamodbstreams";

export function pushStream(opts: streamOptions): Promise<void>

export type transformFunction = (body?: { [key: string]: any }, oldBody?: AttributeMap, record?: Record) => Promise<any> | any

export interface streamOptions {
    event: RecordList,
    index?: string,
    type?: string,
    endpoint: string,
    refresh?: boolean,
    testMode?: boolean,
    transformFunction?: transformFunction,
    elasticSearchOptions?: ClientOptions
}
