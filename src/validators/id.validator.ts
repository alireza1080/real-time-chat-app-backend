import { z } from 'zod';

const idValidator = z
  .string()
  .trim()
  .min(1, 'ID is required')
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID');

export default idValidator;
