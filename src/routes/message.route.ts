import { Router } from 'express';
import {
  getUsers,
  getMessages,
  sendMessage,
} from '../controllers/message.controller.js';
import { upload } from '../utils/upload.js';

const router = Router();

router.get('/users', getUsers);
router.get('/:id', getMessages);
router.post('/send/:id', upload.single('image'), sendMessage);

export default router;
