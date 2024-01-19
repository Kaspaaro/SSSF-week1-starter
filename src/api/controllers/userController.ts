import {
  addUser,
  deleteUser,
  getAllUsers,
  getUser,
  updateUser,
} from '../models/userModel';
import {Request, Response, NextFunction} from 'express';
import CustomError from '../../classes/CustomError';
import bcrypt from 'bcryptjs';
import {User} from '../../types/DBTypes';
import {MessageResponse} from '../../types/MessageTypes';
import {validationResult} from 'express-validator';
const salt = bcrypt.genSaltSync(12);

const userListGet = async (
  _req: Request,
  res: Response<User[]>,
  next: NextFunction
) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

const userGet = async (
  req: Request<{id: string}, {}, {}>,
  res: Response<User>,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const user = await getUser(id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// TODO: create userPost function to add new user
// userPost should use addUser function from userModel
// userPost should use validationResult to validate req.body
// - user_name should be at least 3 characters long
// - email should be a valid email
// - password should be at least 5 characters long
// userPost should use bcrypt to hash password
const userPost = async (
  req: Request<{id: number}, {}, User>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req.body);
    if (!errors.isEmpty()) {
      const messages: string = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      console.log('userPost validation', messages);
      next(new CustomError(messages, 400));
      return;
    }

    const {user_name, email, password, role} = req.body;

    if (user_name.length < 3) {
      next(
        new CustomError('User name should be at least 3 characters long', 400)
      );
      return;
    }

    if (!isValidEmail(email)) {
      next(new CustomError('Invalid email format', 400));
      return;
    }

    if (password.length < 5) {
      next(
        new CustomError('Password should be at least 5 characters long', 400)
      );
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: {
      user_id: number;
      password: string;
      role: 'user' | 'admin';
      user_name: string;
      email: string;
    } = {
      user_id: 0,
      user_name,
      email,
      password: hashedPassword,
      role,
    };

    await addUser(newUser);

    res.status(200).json({message: 'User added'});
  } catch (error) {
    next(error);
  }
};
const isValidEmail = (email: string): boolean => {
  return email.includes('@') && email.includes('.');
};
const userPut = async (
  req: Request<{id: number}, {}, User>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages: string = errors
      .array()
      .map((error) => `${error.msg}: ${error.param}`)
      .join(', ');
    console.log('userPut validation', messages);
    next(new CustomError(messages, 400));
    return;
  }

  try {
    if (req.user && req.user.role !== 'admin') {
      throw new CustomError('Admin only', 403);
    }

    const user = req.body;

    const result = await updateUser(user, req.params.id);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// TODO: create userPutCurrent function to update current user
// userPutCurrent should use updateUser function from userModel
// userPutCurrent should use validationResult to validate req.body
const userPutCurrent = async (
  req: Request,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  const errors = validationResult(req.body);
  if (!errors.isEmpty()) {
    const messages: string = errors
      .array()
      .map((error) => `${error.msg}: ${error.param}`)
      .join(', ');
    console.log('userPutCurrent validation', messages);
    next(new CustomError(messages, 400));
    return;
  }

  try {
    if (req.user && req.user.role !== 'admin') {
      throw new CustomError('Admin only', 403);
    } else {
      const user = req.body;

      const result = await updateUser(user, (req.user as User).user_id);

      res.json(result);
    }
  } catch (error) {
    next(error);
  }
};

const userDelete = async (
  req: Request,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  const errors = validationResult(new Request(req.params.id));
  if (!errors.isEmpty()) {
    const messages: string = errors
      .array()
      .map((error) => `${error.msg}: ${error.param}`)
      .join(', ');
    console.log('userDelete validation', messages);
    next(new CustomError(messages, 400));
    return;
  }

  try {
    if (req.user && req.user.role !== 'admin') {
      throw new CustomError('Unauthorized: Only admins can delete users', 403);
    }

    const userId = req.params.id;
    await deleteUser(userId);

    res.json({message: 'User deleted'});
  } catch (error) {
    next(error);
  }
};

// TODO: create userDelete function for admin to delete user by id
// userDelete should use deleteUser function from userModel
// userDelete should use validationResult to validate req.params.id
// userDelete should use req.user to get role

const userDeleteCurrent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.user_id;
    await deleteUser(userId !== undefined ? userId.toString() : '');
    res.json({
      message: 'user deleted',
    });
  } catch (error) {
    next(error);
  }
};

const checkToken = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    next(new CustomError('token not valid', 403));
  } else {
    res.json(req.user);
  }
};

export {
  userListGet,
  userGet,
  userPost,
  userPut,
  userPutCurrent,
  userDelete,
  userDeleteCurrent,
  checkToken,
};
