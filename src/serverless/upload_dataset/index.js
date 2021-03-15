exports.handler = async event => {
  console.log('hello world');
  const response = {
    statusCode: 200,
    body: JSON.stringify('This is a test'),
  };
  return response;
};
