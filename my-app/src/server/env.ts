type ServerEnvironment = "AUTH_PASSWORD_BCRYPT_HASH" | "JWT_SECRET";

export function requiredEnvironment(name: ServerEnvironment): string {
  const value = process.env[name];

  console.log({
    name,
    exists: !!value,
    length: value?.length,
    startsWith: value?.slice(0, 7),
    endsWith: value?.slice(-5),
  });

  if (!value) throw new Error(`Missing ${name} environment variable.`);

  if (
    name === "AUTH_PASSWORD_BCRYPT_HASH" &&
    !/^\$2[aby]\$(0[4-9]|[12]\d|3[01])\$[./A-Za-z0-9]{53}$/.test(value)
  ) {
    throw new Error("Invalid bcrypt hash");
  }

  return value;
}
