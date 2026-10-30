import { connectDB, closeDB } from '../config/db.js';
import { seedMaterials } from '../services/seedService.js';

await connectDB();
await seedMaterials({ verbose: true });
await closeDB();
