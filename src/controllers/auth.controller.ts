import { Request, Response } from 'express';
import signUpValidator from '../validators/signUp.validator.js';
import { prisma } from '../services/database.service.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.utils.js';
import signInValidator from '../validators/signIn.validator.js';
import idValidator from '../validators/id.validator.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../utils/upload.js';

const signUp = async (req: Request, res: Response) => {
  try {
    if (req.isUserLoggedIn) {
      return res.status(400).json({
        success: false,
        message: 'User is already logged in and cannot sign up again',
      });
    }

    if (!req.body)
      return res.status(400).json({
        message: 'full name, email, password are required',
        success: false,
      });

    const { fullName, email, password, confirmPassword } = req.body;

    const { success, error, data } = signUpValidator.safeParse({
      fullName,
      email,
      password,
      confirmPassword,
    });

    if (!success) {
      return res.status(400).json({
        success: false,
        message: error.issues[0].message,
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (user) {
      return res.status(400).json({
        success: false,
        message: 'Email is already taken',
      });
    }

    //hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        profilePicture: data.profilePicture,
        password: hashedPassword,
      },
      omit: {
        password: true,
      },
    });

    if (!newUser) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create user, try again later',
      });
    }

    const token = generateToken(newUser.id.toString());

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'strict',
    });

    res.json({
      success: true,
      message: 'Sign up successful',
      data: newUser,
    });
  } catch (error) {
    console.log('Error in signUp', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const signIn = async (req: Request, res: Response) => {
  try {
    if (req.isUserLoggedIn) {
      return res.status(400).json({
        success: false,
        message: 'User is already logged in and cannot sign in again',
      });
    }

    if (!req.body)
      return res.status(400).json({
        message: 'email, password are required',
        success: false,
      });

    const { email, password } = req.body;

    const { success, data } = signInValidator.safeParse({
      email,
      password,
    });

    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user.id.toString());

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'strict',
    });

    res.json({
      success: true,
      message: 'Sign in successful',
      data: { ...user, password: undefined },
    });
  } catch (error) {
    console.log('Error in signIn', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getUser = async (req: Request, res: Response) => {
  try {
    if (!req.isUserLoggedIn) {
      // Remove the cookie
      res.cookie('jwt', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 0,
        sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'strict',
      });

      return res.status(401).json({
        success: false,
        message: 'User is not logged in and cannot get user profile',
      });
    }

    const { error } = idValidator.safeParse(req.userId);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      omit: {
        password: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User profile fetched successfully',
      data: user,
    });
  } catch (error) {
    console.log('Error in getUser', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const updateUser = async (req: Request, res: Response) => {
  try {
    if (!req.isUserLoggedIn) {
      return res.status(401).json({
        success: false,
        message: 'User is not logged in and cannot update user profile',
      });
    }

    const { error } = idValidator.safeParse(req.userId);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Profile picture is required',
      });
    }

    const { buffer, originalname, size } = req.file;

    if (!buffer || !originalname) {
      return res.status(400).json({
        success: false,
        message: 'Profile picture is required',
      });
    }

    if (size > 1024 * 1024 * 5) {
      return res.status(400).json({
        success: false,
        message: 'Profile picture must be less than 5MB',
      });
    }

    const fileExtension = originalname.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
    });

    const uploadResult = await s3Client.send(command);

    if (uploadResult.$metadata.httpStatusCode !== 200) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload profile picture',
      });
    }

    const profilePictureUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { profilePicture: profilePictureUrl },
      omit: {
        password: true,
      },
    });

    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update user profile',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.log('Error in updateUser', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const logout = async (_req: Request, res: Response) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    maxAge: 0,
    sameSite: 'strict',
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

export { signUp, signIn, getUser, updateUser, logout };
