import jwt from "jsonwebtoken";
import crypto from "crypto";

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });

// Hash Token
const hashToken = (token) =>
  crypto.createHash("sha256").update(token.toString()).digest("hex");

export { generateToken, hashToken };
