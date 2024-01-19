import {promisePool} from '../../database/db';
import CustomError from '../../classes/CustomError';
import {ResultSetHeader, RowDataPacket} from 'mysql2';
import {User} from '../../types/DBTypes';
import {MessageResponse} from '../../types/MessageTypes';

const getAllUsers = async (): Promise<User[]> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & User[]>(
    `
    SELECT user_id, user_name, email, role 
    FROM sssf_user
    `
  );
  if (rows.length === 0) {
    throw new CustomError('No users found', 404);
  }
  return rows;
};

const getUser = async (userId: number): Promise<User> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & User[]>(
    `
    SELECT user_id, user_name, email, role 
    FROM sssf_user 
    WHERE user_id = ?;
    `,
    [userId]
  );
  if (rows.length === 0) {
    throw new CustomError('No users found', 404);
  }
  return rows[0];
};

// TODO : create addUser function
const addUser = async (data: {
  user_id: number;
  password: string;
  user_name: string;
  email: string;
  role: string;
}): Promise<Number> => {
  try {
    const [headers] = await promisePool.execute<ResultSetHeader>(
      `
    INSERT INTO sssf_user (user_name, email, password)
    VALUES (?, ?, ?);
    `,
      [data.user_name, data.email, data.password]
    );
    if (headers.affectedRows === 0) {
      throw new CustomError('No users added', 400);
    }
    return headers.insertId;
  } catch (error) {
    throw new CustomError('Error adding user', 500);
  }
};
const updateUser = async (
  data: Partial<User>,
  userId: number
): Promise<MessageResponse> => {
  const sql = promisePool.format('UPDATE sssf_user SET ? WHERE user_id = ?;', [
    data,
    userId,
  ]);
  const [headers] = await promisePool.execute<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError('No users updated', 400);
  }
  return {message: 'User updated'};
};

const deleteUser = async (userId: string): Promise<void> => {
  try {
    await promisePool.execute<RowDataPacket[] & User[]>(
      `
      DELETE FROM sssf_user
      WHERE user_id = ?;
      `,
      [userId]
    );
  } catch (error) {
    throw new CustomError('Error deleting user', 500);
  }
};

const getUserLogin = async (email: string): Promise<User> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & User[]>(
    `
    SELECT * FROM sssf_user 
    WHERE email = ?;
    `,
    [email]
  );
  if (rows.length === 0) {
    throw new CustomError('Invalid username/password', 200);
  }
  return rows[0];
};

export {getAllUsers, getUser, addUser, updateUser, deleteUser, getUserLogin};
