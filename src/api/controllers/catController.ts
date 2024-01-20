import {
  addCat,
  deleteCat,
  getAllCats,
  getCat,
  updateCat,
} from '../models/catModel';
import {Request, Response, NextFunction} from 'express';
import CustomError from '../../classes/CustomError';
import {validationResult} from 'express-validator';
import {MessageResponse} from '../../types/MessageTypes';
import {Cat, User} from '../../types/DBTypes';
import {deleteUser} from '../models/userModel';

const catListGet = async (
  _req: Request,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  try {
    const cats = await getAllCats();
    res.json(cats);
  } catch (error) {
    next(error);
  }
};

const catGet = async (
  req: Request<{id: number}>,
  res: Response<Cat>,
  next: NextFunction
) => {
  const errors = validationResult(req.body);
  if (!errors.isEmpty()) {
    const messages: string = errors
      .array()
      .map((error) => `${error.msg}: ${error.param}`)
      .join(', ');
    console.log('cat_get validation', messages, req.params.id);
    next(new CustomError(messages, 400));
    return;
  }

  try {
    const id = req.params.id;
    console.log('CONST id cat ', id);
    const cat = await getCat(id);
    res.json(cat);
  } catch (error) {
    next(error);
  }
};

// TODO: create catPost function to add new cat
const catPost = async (
  req: Request<{}, {}, Omit<Cat, 'owner'> & {owner: number}>,
  res: Response<MessageResponse, {coords: [number, number]}>,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages: string = errors
      .array()
      .map((error) => `${error.msg}: ${error.param}`)
      .join(', ');
    console.log('cat_post validation', messages);
    next(new CustomError(messages, 400));
    return;
  }
  try {
    if (!req.file) {
      next(new CustomError('File is missing in the request', 400));
      return;
    }

    const filename = req.file.filename;

    const [lat, lng] = res.locals.coords;

    const {user_id, role} = req.user as User;

    const cat: Omit<Cat, 'owner'> & {
      owner: number;
      filename: string;
      lat: number;
      lng: number;
      user_id: number;
      role: string;
    } = {
      ...req.body,
      owner: req.body.owner,
      filename,
      lat,
      lng,
      user_id,
      role,
    };

    const result = await addCat(cat);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const catPut = async (
  req: Request<{id: string}, {}, Cat>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages: string = errors
      .array()
      .map((error) => `${error.msg}: ${error.param}`)
      .join(', ');
    console.log('cat_put validation', messages);
    next(new CustomError(messages, 400));
    return;
  }

  try {
    const id = Number(req.body.cat_id);
    const cat = req.body;
    const result = await updateCat(cat, id); // Remove the extra arguments
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// TODO: create catDelete function to delete cat
// catDelete should use deleteCat function from catModel
// catDelete should use validationResult to validate req.params.id

const catDelete = async (
  req: Request<{id: number}, {}, Cat>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  const errors = validationResult(req.params);
  if (!errors.isEmpty()) {
    const messages: string = errors
      .array()
      .map((error) => `${error.msg}: ${error.param}`)
      .join(', ');
    console.log('cat_delete validation', messages);
    next(new CustomError(messages, 400));
    return;
  }

  try {
    if ((req.user as User).role !== 'admin') {
      throw new CustomError('Admin only', 200);
    }
    if ((req.user as User).role === 'admin') {
      const cat = req.body.cat_id;
      const result = await deleteCat(cat);
      res.json(result);
    }
  } catch (error) {
    next(error);
  }
};

export {catListGet, catGet, catPost, catPut, catDelete};
