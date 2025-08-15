import { Router } from 'express';
import authRouter from './auth.route.js';
import messageRouter from './message.route.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/messages', messageRouter);

export default router;
