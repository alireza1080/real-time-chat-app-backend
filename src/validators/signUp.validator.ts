import { z } from 'zod';

const signUpValidator = z
  .object({
    fullName: z
      .string({
        required_error: 'Full name is required',
        invalid_type_error: 'Full name must be a string',
      })
      .nonempty('Full name is required')
      .trim()
      .min(1, 'Full name is required')
      .min(3, 'Full name must be at least 3 characters')
      .max(100, 'Full name must be 100 characters or less')
      .transform((val) =>
        val
          .split(/\s+/)
          .map(
            (word) =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
          )
          .join(' '),
      ),
    email: z
      .string({
        required_error: 'Email is required',
        invalid_type_error: 'Email must be a string',
      })
      .trim()
      .nonempty('Email is required')
      .min(1, 'Email is required')
      .email('Invalid email address')
      .max(254, 'Email must be 254 characters or less')
      .transform((val) => val.toLowerCase()),
    password: z
      .string({
        required_error: 'Password is required',
        invalid_type_error: 'Password must be a string',
      })
      .nonempty('Password is required')
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters long')
      .max(128, 'Password must be 128 characters or less')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/\d/, 'Password must contain at least one digit')
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        'Password must contain at least one special character',
      ),
    confirmPassword: z.string({
      required_error: 'Confirm password is required',
      invalid_type_error: 'Confirm password must be a string',
    }),
    profilePicture: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .transform((data) => ({
    ...data,
    profilePicture:
      data.profilePicture ||
      `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(
        data.fullName,
      )}`,
  }));

export default signUpValidator;
