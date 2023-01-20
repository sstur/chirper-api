import { db } from '../db';
import { Post, User } from '../types';

const users = [
  {
    name: 'Brendan Eich',
    username: 'brendaneich',
    password: '123',
    profilePhoto:
      'https://user-images.githubusercontent.com/369384/211051084-b421a640-42ff-4cc8-8eeb-a009c99fd173.png',
    bio: `Co-founder & CEO @Brave Software (https://brave.com). Co-founded Mozilla & Firefox. Created JavaScript.`,
    following: [],
    followers: [],
    likedPosts: [],
  },
  {
    name: 'Trevor',
    username: 'trevornoah',
    password: '123',
    profilePhoto:
      'https://user-images.githubusercontent.com/369384/210929062-bc7b3209-6961-4e1f-bd0c-16dd38eba013.jpg',
    bio: 'Comedian from South Africa. I was in the crowd when Rafiki held Simba over the edge of the cliff, like an African Michael Jackson.',
    following: [],
    followers: [],
    likedPosts: [],
  },
  {
    name: 'Olivia Greene',
    profilePhoto:
      'https://user-images.githubusercontent.com/369384/192453593-560d6ae3-0e11-44dd-90f5-f0b87a8b4ce9.jpg',
    username: 'olivia',
    password: '123',
    bio: '',
    following: [],
    followers: [],
    likedPosts: [],
  },
  {
    name: 'Kevin',
    profilePhoto:
      'https://user-images.githubusercontent.com/369384/192453596-ea862041-f1de-4e71-880b-2573c1f47ce8.jpg',
    username: 'kevin',
    password: '123',
    bio: '',
    following: [],
    followers: [],
    likedPosts: [],
  },
  {
    name: 'Liza',
    profilePhoto:
      'https://user-images.githubusercontent.com/369384/192453597-cc7bff73-b838-4db6-a137-6706805195bf.jpg',
    username: 'liza',
    password: '123',
    bio: '',
    following: [],
    followers: [],
    likedPosts: [],
  },
  {
    name: 'Zach',
    profilePhoto:
      'https://user-images.githubusercontent.com/369384/192453599-affcb8f9-b475-40c1-94dc-2f7d23f820c6.jpg',
    username: 'zach',
    password: '123',
    bio: '',
    following: [],
    followers: [],
    likedPosts: [],
  },
  {
    name: 'Simon',
    username: 'sstur',
    password: '123',
    profilePhoto:
      'https://s.gravatar.com/avatar/a01b931867096ec8874202e233279212?s=256',
    bio: 'Software engineer, founder, speaker, trainer. SF Bay Area.',
    following: [],
    followers: [],
    likedPosts: [],
  },
];

const posts = [
  {
    content:
      'NYC! Join me on Tuesday 11/29, as I host a black theatre night for one of the most transcendent plays I’ve seen.',
    author: 'trevornoah',
    likedBy: [],
    createdAt: '2023-01-06T01:30:22.000Z',
  },
  {
    content: `Join me to learn TypeScript and React Native. We'll build an awesome app.`,
    author: 'sstur',
    likedBy: [],
    createdAt: '2023-01-05T01:10:00.000Z',
  },
  {
    content: 'I miss when Lindsay Lohan ruled cinema',
    author: 'oliviagreene',
    likedBy: [],
    createdAt: '2023-01-04T01:10:00.000Z',
  },
  {
    content: `Who owns your attention? Who owns your web browsing experience? Who gets paid? If not you, then you're "product".`,
    author: 'brendaneich',
    likedBy: [],
    createdAt: '2023-01-03T01:10:00.000Z',
  },
  {
    content: 'Turnips are delicious',
    author: 'zach',
    likedBy: [],
    createdAt: '2022-09-24T00:14:00.000Z',
  },
  {
    content: "Enjoy life for it's beauty",
    author: 'liza',
    likedBy: [],
    createdAt: '2022-09-25T12:32:00.000Z',
  },
  {
    content: "It's colder at night than outside",
    author: 'zach',
    likedBy: [],
    createdAt: '2022-09-26T01:12:00.000Z',
  },
];

async function seed() {
  const insertedUsers = new Map<string, User>();
  for (const user of users) {
    const newUser = await db.User.insert(user);
    console.log(`Inserted user: ${newUser.username}`);
    insertedUsers.set(user.username, newUser);
  }
  for (const post of posts) {
    const user = insertedUsers.get(post.author);
    if (user) {
      const newPost = await db.Post.insert({
        ...post,
        author: user.id,
      });
      console.log(`Inserted post: ${newPost.id}`);
    }
  }
  console.log('Done.');
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
