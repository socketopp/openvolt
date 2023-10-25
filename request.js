import { config } from 'dotenv';
config();

const api_key = process.env.OPENVOLT_API_KEY;

export async function request({ url, method, data }) {
  console.log(`Requesting from ${url}`);
  const options = {
    method,
    headers: {
      accept: 'application/json',
      'x-api-key': api_key,
    },
  };
  if (data) {
    options.body = JSON.stringify(data);
    options.headers['Content-Type'] = 'application/json';
  }
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      console.log('response not ok');
      const body = await response.json();
      console.log('body', body);
      throw new Error(body?.error ? body.error : body.message.error);
    }
    const contentType = response.headers.get('Content-Type');
    if (contentType.includes('application/json')) {
      return await response.json();
    }
    return response.text();
  } catch (error) {
    console.error('An error occurred:', error);
    throw error;
  }
}
