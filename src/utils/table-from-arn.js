// Extracts the DynamoDB table from an ARN
module.exports = (arn) => {
	// This is a default dynamo table arn
	// Initial ex
	// arn:aws:dynamodb:eu-west-1:123456789012:table/table-name/stream/2015-11-13T09:23:17.104

	// After split
	// [ 
	// 	'arn:aws:dynamodb:eu-west-1:123456789012:table', 0
	// 	'table-name', 1
	// 	'stream', 2
	// 	'2015-11-13T09:23:17.104' 3
	// ]
	return arn.split('/')[1];
}