import { handleLogin } from "../../server/gym/http.js";

export default function handler(req, res) {
  return handleLogin(req, res);
}
