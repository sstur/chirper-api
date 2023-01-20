import SchemaBuilder from '@pothos/core';
import { db } from '../db';
import { removeNulls } from '../support/removeNulls';
import type { User, Session, Post } from '../types';

type Objects = {
  User: User;
  Post: Post;
  PostListItem: Post;
  Session: Session;
};

type Context = {
  getSession: () => Promise<Session | null>;
  getCurrentUser: () => Promise<User | null>;
  authenticate: () => Promise<User>;
};

const builder = new SchemaBuilder<{ Objects: Objects; Context: Context }>({});

builder.objectType('User', {
  fields: (t) => ({
    id: t.exposeString('id', {}),
    name: t.exposeString('name', {}),
    profilePhoto: t.exposeString('profilePhoto', {}),
    username: t.exposeString('username', {}),
  }),
});

builder.objectType('Session', {
  fields: (t) => ({
    token: t.string({ resolve: (session) => session.id }),
    user: t.field({
      type: 'User',
      resolve: async (session) => {
        const user = await db.User.getById(session.user);
        if (!user) {
          throw new Error('Invalid userId in session');
        }
        return user;
      },
    }),
  }),
});

builder.objectType('PostListItem', {
  fields: (t) => ({
    id: t.exposeString('id', {}),
    author: t.field({
      type: 'User',
      resolve: async (post) => {
        const user = await db.User.getById(post.author);
        if (!user) {
          throw new Error(`Invalid userId at post(${post.id}).author`);
        }
        return user;
      },
    }),
    content: t.exposeString('content', {}),
    isLikedByViewer: t.boolean({
      resolve: async (post, args, context) => {
        const currentUser = await context.getCurrentUser();
        if (currentUser) {
          return post.likedBy.includes(currentUser.id);
        } else {
          return false;
        }
      },
    }),
    likeCount: t.int({
      resolve: (post) => post.likedBy.length,
    }),
    createdAt: t.exposeString('createdAt', {}),
  }),
});

builder.objectType('Post', {
  fields: (t) => ({
    id: t.exposeString('id', {}),
    author: t.field({
      type: 'User',
      resolve: async (post) => {
        const user = await db.User.getById(post.author);
        if (!user) {
          throw new Error(`Invalid userId at post(${post.id}).author`);
        }
        return user;
      },
    }),
    content: t.exposeString('content', {}),
    isLikedByViewer: t.boolean({
      resolve: async (post, args, context) => {
        const currentUser = await context.getCurrentUser();
        if (currentUser) {
          return post.likedBy.includes(currentUser.id);
        } else {
          return false;
        }
      },
    }),
    likeCount: t.int({
      resolve: (post) => post.likedBy.length,
    }),
    createdAt: t.exposeString('createdAt', {}),
  }),
});

const UserCreateInput = builder.inputType('UserCreateInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    profilePhoto: t.string({ required: true }),
    username: t.string({ required: true }),
    password: t.string({ required: true }),
    bio: t.string({ required: true }),
  }),
});

const UserUpdateInput = builder.inputType('UserUpdateInput', {
  fields: (t) => ({
    name: t.string(),
    profilePhoto: t.string(),
    username: t.string(),
    password: t.string(),
    bio: t.string(),
  }),
});

const PostCreateInput = builder.inputType('PostCreateInput', {
  fields: (t) => ({
    content: t.string({ required: true }),
  }),
});

builder.queryType({
  fields: (t) => ({
    postCount: t.int({
      resolve: async () => {
        const posts = await db.Post.getAll();
        return posts.length;
      },
    }),

    posts: t.field({
      type: ['PostListItem'],
      args: {
        postedBy: t.arg.string(),
      },
      resolve: async (parent, { postedBy }) => {
        let posts: Array<Post>;
        if (postedBy == null) {
          posts = await db.Post.getAll();
        } else {
          posts = await db.Post.findWhere((post) => post.author === postedBy);
        }
        posts.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
        return posts;
      },
    }),

    post: t.field({
      type: 'Post',
      nullable: true,
      args: {
        id: t.arg.string({ required: true }),
      },
      resolve: async (parent, { id }) => {
        return await db.Post.getById(id);
      },
    }),

    users: t.field({
      type: ['User'],
      resolve: async () => {
        return await db.User.getAll();
      },
    }),

    user: t.field({
      type: 'User',
      nullable: true,
      args: {
        id: t.arg.string({ required: true }),
      },
      resolve: async (parent, { id }) => {
        return await db.User.getById(id);
      },
    }),

    me: t.field({
      type: 'User',
      nullable: true,
      resolve: async (parent, args, context) => {
        return await context.getCurrentUser();
      },
    }),
  }),
});

builder.mutationType({
  fields: (t) => ({
    login: t.field({
      type: 'Session',
      nullable: true,
      args: {
        username: t.arg.string({ required: true }),
        password: t.arg.string({ required: true }),
      },
      resolve: async (parent, args) => {
        const { username, password } = args;
        const [user] = await db.User.findWhere(
          (user) =>
            user.username.toLowerCase() === username.toLowerCase() &&
            user.password === password,
        );
        if (!user) {
          return null;
        }
        const session = await db.Session.insert({
          user: user.id,
          createdAt: new Date().toISOString(),
        });
        return session;
      },
    }),

    logout: t.field({
      type: 'Boolean',
      nullable: true,
      resolve: async (parent, args, context) => {
        const session = await context.getSession();
        if (session) {
          await db.Session.delete(session.id);
          return true;
        } else {
          return false;
        }
      },
    }),

    createUser: t.field({
      type: 'User',
      args: {
        input: t.arg({ type: UserCreateInput, required: true }),
      },
      resolve: async (parent, args) => {
        const { name, profilePhoto, username, password, bio } = args.input;
        if (!username.length || username.match(/\W/)) {
          throw new Error('Invalid username');
        }
        const existingUsers = await db.User.findWhere(
          (user) => user.username.toLowerCase() === username.toLowerCase(),
        );
        if (existingUsers.length) {
          throw new Error('Username already exists');
        }
        return await db.User.insert({
          name,
          profilePhoto,
          username,
          password,
          bio,
          following: [],
          followers: [],
          likedPosts: [],
        });
      },
    }),

    updateUser: t.field({
      type: 'User',
      args: {
        input: t.arg({ type: UserUpdateInput, required: true }),
      },
      resolve: async (parent, args, context) => {
        const user = await context.authenticate();
        const userId = user.id;
        const updates = removeNulls(args.input);
        const { username } = updates;
        if (username !== undefined) {
          if (!username.length || username.match(/\W/)) {
            throw new Error('Invalid username');
          }
          const existingUsers = await db.User.findWhere(
            (user) =>
              user.id !== userId &&
              user.username.toLowerCase() === username.toLowerCase(),
          );
          if (existingUsers.length) {
            throw new Error('Username already exists');
          }
        }
        const newUser = await db.User.update(user.id, updates);
        return newUser ?? user;
      },
    }),

    createPost: t.field({
      type: 'Post',
      args: {
        input: t.arg({ type: PostCreateInput, required: true }),
      },
      resolve: async (parent, args, context) => {
        const user = await context.authenticate();
        const { content } = args.input;
        const post = await db.Post.insert({
          author: user.id,
          content,
          likedBy: [],
          createdAt: new Date().toISOString(),
        });
        return post;
      },
    }),

    deletePost: t.field({
      type: 'Boolean',
      args: {
        postId: t.arg.string({ required: true }),
      },
      resolve: async (parent, args, context) => {
        const user = await context.authenticate();
        const { postId } = args;
        const post = await db.Post.getById(postId);
        if (!post) {
          throw new Error('Invalid postId');
        }
        if (post.author !== user.id) {
          throw new Error('Permission denied');
        }
        await db.Post.delete(post.id);
        return true;
      },
    }),

    likePost: t.field({
      type: 'Boolean',
      args: {
        postId: t.arg.string({ required: true }),
      },
      resolve: async (parent, { postId }, context) => {
        const user = await context.authenticate();
        const post = await db.Post.getById(postId);
        if (!post) {
          throw new Error('Invalid postId');
        }
        const wasLiked = user.likedPosts.includes(postId);
        const likedBy = post.likedBy.filter((userId) => userId !== user.id);
        if (!wasLiked) {
          likedBy.push(user.id);
        }
        await db.Post.update(postId, { likedBy });
        const likedPosts = user.likedPosts.filter((id) => id !== postId);
        if (!wasLiked) {
          likedPosts.push(postId);
        }
        await db.User.update(user.id, { likedPosts });
        return !wasLiked;
      },
    }),
  }),
});

export const schema = builder.toSchema();
