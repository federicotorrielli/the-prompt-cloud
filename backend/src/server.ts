import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import prisma from './lib/prisma'; // Import shared prisma instance

import folderRoutes from './routes/folderRoutes'; // Import folder routes
import promptRoutes from './routes/promptRoutes'; // Import prompt routes

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;
// Remove the local PrismaClient instantiation
// const prisma = new PrismaClient();

app.use(cors()); // Allow requests from frontend
app.use(express.json()); // Middleware to parse JSON bodies

// API Routes
app.use('/api/folders', folderRoutes); // Use folder routes
app.use('/api/prompts', promptRoutes); // Use prompt routes

// Basic health check route
app.get('/', (req: Request, res: Response) => {
  res.send('The Prompt Cloud Backend is running!');
});

// Remove the placeholder TODO
// // TODO: Add API routes for prompts and folders here

async function main() {
  // Use the imported prisma instance for connection check
  try {
    await prisma.$connect();
    console.log("Database connected successfully.");
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    process.exit(1);
  }

  // Start the server
  app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  });
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect(); // Disconnect shared instance on error
    process.exit(1);
  });

// Optional: Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
// No need for finally block here as disconnect is handled in catch and upon successful exit signal (graceful shutdown would be better)
// .finally(async () => {
//   await prisma.$disconnect();
// }); 