import { NextFunction, Request, Response } from 'express';

const badJsonErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'The JSON payload is malformed',
    });
  }
  next();
};

export default badJsonErrorHandler;
