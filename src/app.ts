import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import apiRouter from './routes/api.route.js';
import isUserLoggedIn from './middlewares/isUserLoggedIn.middleware.js';
import badJsonErrorHandler from './middlewares/badJsonErrorHandler.middleware.js';
import helmet from 'helmet';
import cors from 'cors';
import { config } from 'dotenv';
import { createServer } from 'http';

config();
const clientUrl = process.env.CLIENT_URL;

const app = express();
const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(helmet());
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  }),
);

app.use(isUserLoggedIn);
app.use(badJsonErrorHandler);

app.use('/api', apiRouter);

export { app, server };
