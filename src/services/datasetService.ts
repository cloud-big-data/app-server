const fetch = require('node-fetch');

const makeFetch = (method: 'GET' | 'POST' | 'PATCH' | 'DELETE') => (
  route: string,
  body?: any,
) =>
  fetch(`${process.env.DATASET_SERVICE_URL}/api${route}`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      secret: process.env.DATASET_SERVICE_SECRET,
    },
  });

const datasetService = {
  post: makeFetch('POST'),
};

export default datasetService;
