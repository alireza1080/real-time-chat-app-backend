import { Router } from 'express';
import {
  signUp,
  signIn,
  logout,
  getUser,
  updateUser,
} from '../controllers/auth.controller.js';
import { upload } from '../utils/upload.js';

const router = Router();

router.post('/signup', signUp);

router.post('/signin', signIn);

router.delete('/logout', logout);

router.get('/get-user', getUser);

router.put('/update-user', upload.single('profilePicture'), updateUser);

export default router;
