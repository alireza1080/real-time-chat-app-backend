import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/database.service.js';

const isUserLoggedIn = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      req.isUserLoggedIn = false;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    if (typeof decoded !== 'object' || !('userId' in decoded)) {
      req.isUserLoggedIn = false;
      return next();
    }

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
    });

    if (!user) {
      res.cookie('jwt', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 0,
        sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
      });

      req.isUserLoggedIn = false;
      return next();
    }

    req.isUserLoggedIn = true;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.log('Error in isUserLoggedIn middleware:', error);
    req.isUserLoggedIn = false;
    next();
  }
};

export default isUserLoggedIn;
