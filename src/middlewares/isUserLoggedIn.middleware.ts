import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const isUserLoggedIn = async (
  req: Request,
  _res: Response,
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
      // Valid token, but unexpected payload
      req.isUserLoggedIn = false;
      return next();
    }

    req.isUserLoggedIn = true;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    // This catches invalid/expired tokens
    console.log('Error in isUserLoggedIn middleware:', error);
    req.isUserLoggedIn = false;
    next();
  }
};

export default isUserLoggedIn;
