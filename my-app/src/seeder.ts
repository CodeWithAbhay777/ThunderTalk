import crypto from "crypto";

const key = crypto.randomBytes(16).toString("base64");
console.log("Generated key:", key);