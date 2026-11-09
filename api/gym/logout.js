import { handleLogout } from "../../server/gym/http.js";

export default function handler(req, res) {
  return handleLogout(req, res);
}
