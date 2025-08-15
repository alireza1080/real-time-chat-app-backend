export {};

declare global {
  namespace Express {
    interface Request {
      isUserLoggedIn?: boolean;
      userId?: string;
    }
  }
}
