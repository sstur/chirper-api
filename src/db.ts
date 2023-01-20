import { fromSchema, Model } from './support/orm';
import { User, Session, Post } from './types';

export const db = fromSchema({
  User: Model<User>(),
  Session: Model<Session>(),
  Post: Model<Post>(),
});
