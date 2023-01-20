export type User = {
  id: string;
  name: string;
  profilePhoto: string;
  username: string;
  password: string;
  bio: string;
  following: Array<string>;
  followers: Array<string>;
  likedPosts: Array<string>;
};

export type Session = {
  id: string;
  user: string;
  createdAt: string;
};

export type Post = {
  id: string;
  author: string;
  content: string;
  likedBy: Array<string>;
  createdAt: string;
};
