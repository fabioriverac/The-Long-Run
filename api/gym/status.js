import { handleStatus } from "../../server/gym/http.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.statusCode = 405;
    res.end("Use GET.");
    return;
  }
  await handleStatus(req, res);
}
