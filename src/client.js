import { get } from "node:http";

const url = "http://localhost:3000";

const getHttpStream = () =>
  new Promise((resolve) => get(url, (response) => resolve(response)));

const stream = await getHttpStream();

stream.pipe(process.stdout);
