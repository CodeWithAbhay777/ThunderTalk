type ServerEnvironment = "AUTH_PASSWORD_BCRYPT_HASH" | "JWT_SECRET";

export function requiredEnvironment(name: ServerEnvironment): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} environment variable.`);

  if (name === "AUTH_PASSWORD_BCRYPT_HASH" && !/^\$2[aby]\$(0[4-9]|[12]\d|3[01])\$[./A-Za-z0-9]{53}$/.test(value)) {
    throw new Error("AUTH_PASSWORD_BCRYPT_HASH must be a complete bcrypt hash (for example, one generated with bcrypt.hash(password, 12)).");
  }

  return value;
}
