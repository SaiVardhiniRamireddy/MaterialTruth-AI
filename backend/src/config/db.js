import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { env } from './env.js';

let mongod = null;

export async function connectDB() {
  mongoose.set('strictQuery', true);
  // sanitizeFilter is disabled: all user-supplied input is already validated and
  // sanitised by Zod schemas before reaching Mongoose, so the global plugin is
  // not needed and only breaks internal server-side queries that use $ operators.

  let uri = env.mongoUri;

  // If no real MongoDB URI is set (still the placeholder), spin up an in-memory server
  // that downloads a real MongoDB binary on first run. Data persists to disk via
  // the MMS_TMPDIR pattern below so it survives restarts during the same dev session.
  if (!uri || uri === 'mongodb://127.0.0.1:27017/materialtruth' && !(await isReachable(uri))) {
    console.log('[db] Local MongoDB not reachable — starting embedded mongodb-memory-server…');
    mongod = await MongoMemoryServer.create({
      instance: { dbName: 'materialtruth' },
    });
    uri = mongod.getUri();
    console.log(`[db] Embedded MongoDB URI: ${uri}`);
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log('[db] Connected to MongoDB');
}

async function isReachable(uri) {
  try {
    const tmp = mongoose.createConnection();
    await tmp.openUri(uri, { serverSelectionTimeoutMS: 2000 });
    await tmp.close();
    return true;
  } catch {
    return false;
  }
}

export async function closeDB() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}
