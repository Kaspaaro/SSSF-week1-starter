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
  req: Request<{}, {}, User>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  const errors = validationResult(req.body);
  if (!errors.isEmpty()) {
    const messages: string = errors
      .array()
      .map((error) => `${error.msg}: ${error.param}`)
      .join(', ');
    console.log('user_post validation', messages);
    next(new CustomError(messages, 400));
    return;
  }

  try {
    const user = req.body;
    if (user.password.length < 5) {
      throw new CustomError('Password too short', 400);
    }
    if (user.user_name.length < 3) {
      throw new CustomError('Username too short', 400);
    }
    const regex = /\S+@\S+\.\S+/;
    if (!regex.test(user.email)) {
      throw new CustomError('Invalid email', 400);
    }

    user.password = bcrypt.hashSync(user.password, salt);

    const result = await addUser(user);

    res.json(result);
  } catch (error) {
    next(error);
  }
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
    console.log('user_put validation', messages);
    next(new CustomError(messages, 400));
    return;
  }

  try {
    const user = req.body;

    if (user && user.role !== 'admin') {
      throw new CustomError('Admin only', 403);
    }

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
  req: Request<{}, {}, User>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  const errors = validationResult(req.body);
  if (!errors.isEmpty()) {
    const messages: string = errors
      .array()
      .map((error) => `${error.msg}: ${error.param}`)
      .join(', ');
    next(new CustomError(messages, 400));
    return;
  }
  const user = req.user;
  if (!user) {
    throw new CustomError('No user', 400);
  }
  try {
    const result = await updateUser(req.body, (req.user as User).user_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// TODO: create userDelete function for admin to delete user by id
// userDelete should use deleteUser function from userModel
// userDelete should use validationResult to validate req.params.id
// userDelete should use req.user to get role

const userDelete = async (
  req: Request<{id: number}, {}, User>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  const errors = validationResult(new Request(String(req.params.id)));
  if (!errors.isEmpty()) {
    const messages: string = errors
      .array()
      .map((error) => `${error.msg}: ${error.param}`)
      .join(', ');
    console.log('user_delete validation', messages);
    next(new CustomError(messages, 400));
    return;
  }

  try {
    if ((req.user as User).role !== 'admin') {
      throw new CustomError('Admin only', 403);
    }

    const result = await deleteUser((req.user as User).user_id);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const userDeleteCurrent = async (
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
      console.log('user_post validation', messages);
      next(new CustomError(messages, 400));
      return;
    }

    if (!(req.user as User).user_id && (req.user as User).role !== 'admin') {
      throw new CustomError('Not user or admin', 400);
    }
    const result = await deleteUser((req.user as User).user_id);

    res.json(result);
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
