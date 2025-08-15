import { Request, Response } from 'express';
import { prisma } from '../services/database.service.js';
import idValidator from '../validators/id.validator.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../utils/upload.js';
import { getReceiverSocketId, io } from '../utils/socket.js';

const getUsers = async (req: Request, res: Response) => {
  try {
    const mainUserId = req.userId;

    if (!mainUserId) {
      return res.status(401).json({ message: 'Unauthorized', success: false });
    }

    const { error } = idValidator.safeParse(mainUserId);

    if (error) {
      return res
        .status(400)
        .json({ message: 'Invalid main user ID', success: false });
    }

    const users = await prisma.user.findMany({
      where: {
        NOT: {
          id: mainUserId,
        },
      },
      omit: {
        password: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      message: 'Users fetched successfully',
      success: true,
      data: users,
    });
  } catch (error) {
    console.log('Error in getUsers', error);
    return res
      .status(500)
      .json({ message: 'Internal server error', success: false });
  }
};

const getMessages = async (req: Request, res: Response) => {
  try {
    const mainUserId = req.userId;

    if (!mainUserId) {
      return res.status(401).json({ message: 'Unauthorized', success: false });
    }

    const { error } = idValidator.safeParse(mainUserId);

    if (error) {
      return res
        .status(400)
        .json({ message: 'Invalid main user ID', success: false });
    }

    const mainUser = await prisma.user.findUnique({
      where: {
        id: mainUserId,
      },
    });

    if (!mainUser) {
      return res
        .status(400)
        .json({ message: 'Main user not found', success: false });
    }

    const { id: contactUserId } = req.params;

    if (!contactUserId) {
      return res
        .status(400)
        .json({ message: 'Contact ID is required', success: false });
    }
    const { error: contactUserIdError } = idValidator.safeParse(contactUserId);

    if (contactUserIdError) {
      return res
        .status(400)
        .json({ message: 'Invalid contact user ID', success: false });
    }

    const contactUser = await prisma.user.findUnique({
      where: {
        id: contactUserId,
      },
    });

    if (!contactUser) {
      return res
        .status(400)
        .json({ message: 'Contact user not found', success: false });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            senderId: mainUserId,
            receiverId: contactUserId,
          },
          {
            senderId: contactUserId,
            receiverId: mainUserId,
          },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return res.status(200).json({
      message: 'Messages fetched successfully',
      success: true,
      data: messages,
    });
  } catch (error) {
    console.log('Error in getMessages', error);
    return res
      .status(500)
      .json({ message: 'Internal server error', success: false });
  }
};

const sendMessage = async (req: Request, res: Response) => {
  try {
    const mainUserId = req.userId;

    if (!mainUserId) {
      return res.status(401).json({ message: 'Unauthorized', success: false });
    }

    const { error: mainUserIdError } = idValidator.safeParse(mainUserId);

    if (mainUserIdError) {
      return res
        .status(400)
        .json({ message: 'Invalid main user ID', success: false });
    }

    const { id: contactUserId } = req.params;

    if (!contactUserId) {
      return res
        .status(400)
        .json({ message: 'Contact ID is required', success: false });
    }

    const { error: contactUserIdError } = idValidator.safeParse(contactUserId);

    if (contactUserIdError) {
      return res
        .status(400)
        .json({ message: 'Invalid contact user ID', success: false });
    }

    const text = req.body?.text || '';

    const imageFile = req.file || undefined;

    if (!text && !imageFile) {
      return res
        .status(400)
        .json({
          message: 'Either text or an image is required',
          success: false,
        });
    }

    let image = '';

    if (imageFile) {
      const { buffer, originalname, size } = imageFile;

      if (size > 1024 * 1024 * 5) {
        return res
          .status(400)
          .json({ message: 'Image must be less than 5MB', success: false });
      }

      const fileExtension = originalname.split('.').pop();
      const fileName = `${mainUserId}-${Date.now()}.${fileExtension}`;

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
      });

      const uploadResult = await s3Client.send(command);

      if (uploadResult.$metadata.httpStatusCode !== 200) {
        return res
          .status(500)
          .json({ message: 'Failed to upload image', success: false });
      }

      image = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
    }

    const message = await prisma.message.create({
      data: {
        senderId: mainUserId,
        receiverId: contactUserId,
        text,
        image,
      },
    });

    //!Send message to socket
    const receiverSocketId = getReceiverSocketId(contactUserId);

    //! Check if receiver is online and send message to them
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('newMessage', message);
    }

    return res.status(200).json({
      message: 'Message sent successfully',
      success: true,
      data: message,
    });
  } catch (error) {
    console.log('Error in sendMessage', error);
    return res
      .status(500)
      .json({ message: 'Internal server error', success: false });
  }
};

export { getUsers, getMessages, sendMessage };
