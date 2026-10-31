# OpenBlogs

OpenBlogs is a full-stack publishing platform for independent writers and readers. Readers can discover stories and authors; authors can publish and manage posts from a private studio. The application is built with React, Express, MongoDB, JWT authentication, and Cloudinary image storage.

**Live application:** [OpenBlogs](https://open-blogs-a-place-to-share-your-thoughts-mern-cloudinary.vercel.app/)

## Product features

- Reader and author accounts with JWT-backed authentication.
- Author studio with blog creation, editing, deletion, and dashboard charts.
- Cloudinary-hosted cover and article images.
- Search across story titles, author names, topics, and introductions; filter by available topics.
- Persistent light and X-inspired dark themes.
- Responsive editorial feed, story detail pages, and author profiles.

## Stack

- **Client:** React 18, Vite, Tailwind CSS 4, DaisyUI 5
- **API:** Node.js, Express 4, Mongoose
- **Services:** MongoDB Atlas (or local MongoDB), Cloudinary
- **Auth:** JWT in an HTTP cookie

## Local development

Use Node.js 18 or newer. Install and start the API in one terminal:

```bash
cd backend
npm install
npm start
```

The API reads its configuration from `backend/config/config.env` (relative to the backend working directory). Create that file with:

```dotenv
PORT=7777
FRONTEND_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/openblogs
CLOUDINARY_CLIENT_NAME=your_cloud_name
CLOUDINARY_CLIENT_API=your_cloudinary_api_key
CLOUDINARY_CLIENT_SECRET=your_cloudinary_api_secret
JWT_SECRET_KEY=replace_with_a_long_random_secret
JWT_EXPIRES=7d
COOKIE_EXPIRE=7
```

In a second terminal, install and start the Vite client:

```bash
cd frontend
npm install
```

Copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_URL=http://localhost:7777`, then run:

```bash
npm run dev
```

Open `http://localhost:5173`. Cloudinary credentials and a reachable MongoDB instance are required for registration, publishing, and image uploads. Never commit real environment files or credentials.

## Useful commands

Run these from `frontend/`:

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

Run the API from `backend/` with `npm start`.

## Deployment configuration

Set `VITE_API_URL` in the frontend deployment environment. Set `FRONTEND_URL`, `PORT`, `MONGO_URI`, Cloudinary credentials, and JWT/cookie settings in the backend environment file or hosting provider. Configure CORS to allow the exact deployed frontend origin and serve the frontend over HTTPS when using cookie authentication.

## Project layout

```text
backend/   Express API, MongoDB models, authentication, and blog/user routes
frontend/  React application, routes, UI components, and Tailwind styles
```


