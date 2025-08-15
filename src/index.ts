import dotenv from 'dotenv';
import { connectToDatabase } from './services/database.service.js';
import { server } from './utils/socket.js';
import './utils/socket.js';

dotenv.config();

const PORT = process.env.PORT;

server.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await connectToDatabase();
});
