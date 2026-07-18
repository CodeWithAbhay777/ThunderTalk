import mongoose from "mongoose";

function mongoUri(): string {
  const value = process.env.MONGODB_URI;
  if (!value) throw new Error("Missing MONGODB_URI environment variable.");
  return value;
}

declare global { var mongooseConnection: Promise<typeof mongoose> | undefined; }

export function connectDatabase(): Promise<typeof mongoose> {
  if (!global.mongooseConnection) {
    global.mongooseConnection = mongoose.connect(mongoUri(), { bufferCommands: false });
  }
  return global.mongooseConnection;
}
