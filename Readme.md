# OpenBlogs

OpenBlogs is a full-stack publishing platform for independent writers and readers. Readers can discover stories and authors; authors can publish and manage posts from a private studio. The application is built with React, Express, MongoDB, JWT authentication, and Cloudinary image storage.

**Live application:** [OpenBlogs](https://open-blogs-a-place-to-share-your-thoughts-mern-cloudinary.vercel.app/)

## Product features

- Reader and author accounts with JWT-backed authentication.
- Theme-aware author studio with a responsive workspace, library overview, searchable stories, published/draft filters, and confirmed deletion.
- Shared create/edit writing room with cover previews, optional story sections, word count, publishing checklist, and explicit draft/publish controls.
- Publishing insights derived from real story counts and topic distribution; story-library filters for upvotes, star ratings, and comments.
- Cloudinary-hosted cover and article images.
- Search across story titles, author names, topics, and introductions; filter by available topics.
- Persistent light and X-inspired dark themes.
- Responsive editorial feed, story detail pages, and author profiles.
- Animated editorial reading experience with scroll progress, chapter navigation, adjustable text size, link sharing, and topic-prioritized reading recommendations. Respects reduced-motion preferences.
- Animated writer directory with name/topic search and sorting; individual author profiles with published writing, topic filters, and real story counts.
- Persistent story upvotes, 1-5-star ratings, paginated comments, and community author rankings with theme-aware custom dropdowns.

## Stack

- **Client:** React 18, Vite, Tailwind CSS 4, DaisyUI 5
- **API:** Node.js, Express 4, Mongoose
- **Services:** MongoDB Atlas (or local MongoDB), Cloudinary
- **Auth:** JWT in an HTTP cookie

## Author workflow

Sign in with an author account and open **Studio**. The overview summarizes your library; **My stories** supports search, status filters, editing, and deletion. **Write a story** opens the editor, while **Insights** shows your publishing balance and topics. **Account** displays your registered details and links to your public author profile.

Studio tabs have shareable URLs such as `/dashboard?tab=stories`. Both creating and editing use the same theme-aware editor. Drafts require a title, topic, cover image, and an introduction of at least 250 characters, just like published stories. Changes are not auto-saved; use **Save draft**, **Publish story**, or **Save & publish**. Cancelling, following workspace links, signing out, or closing the browser with unsaved changes prompts for confirmation.

## Reading experience

Sign in and open a story to enter the reading view. Signing in through a story's prompt returns you to that story. Use the contents guide (collapsible on mobile) to jump between available chapters, and the **Aa** controls to adjust text size for the current story. Reading progress follows the article body, while estimated reading time includes all of its text sections. **Copy link** shares the canonical story address through the browser clipboard when available. Related published stories prioritize the current topic and exclude the open story. Entrance, image, and scroll-reveal animations honor the device's reduced-motion preference.

## Writer discovery

The **Writers** directory supports name/topic searches, topic filtering, alphabetical sorting, and sorting by published story count. Author profiles load independently of the homepage feed, including writers who have not published yet. Public profiles show the writer's name, avatar, joining month, topics, and published stories, without displaying their email or phone number. Both pages support light/dark themes, responsive layouts, and reduced-motion preferences, with explicit empty, loading, and retry states.

## Community interactions

Signed-in readers can upvote published stories, leave a 1-5-star rating, and post comments of up to 2,000 characters. Each account has one upvote and one rating per story; both can be changed or removed. Authors cannot upvote or rate their own stories. Comments load newest first in pages of 20, and can be deleted by their writer or the story's author. Drafts do not accept community interactions or contribute to rankings.

Community rank is based on all-time **upvotes + total stars received** across an author's published stories. Equal scores share a rank; authors without reactions remain unranked. The displayed average rating is weighted across individual ratings, not averaged across story averages. Writer discovery includes upvote/rating filters and sorts, while **Studio > My stories** adds response filters and sorting by upvotes, rating, or comment count. Public author profiles and homepage writer cards use the same reputation calculation.

The API stores reactions in `BlogInteraction` and comments in `Comment`. Startup waits for their schema indexes, including the unique `(blog, user)` reaction index. Restart the backend when deploying these changes. Focused controller and model tests run from the repository root with `node --test backend/tests/community.test.js`; these tests mock database operations and do not replace live MongoDB integration testing.

## Local development

Use Node.js 18 or newer. Install and start the API in one terminal:

```bash
cd backend
npm install
npm start
```

The API reads its configuration from `backend/.env`. Create that file with:

```dotenv
PORT=7000
FRONTEND_URL=http://localhost:5173
FRONTEND_URLS=https://open-blogs-a-place-to-share-your-thoughts-mern-cloudinary.vercel.app
MONGO_URI=mongodb://127.0.0.1:27017/openblogs
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRE=7d
COOKIE_EXPIRE=7
```

In a second terminal, install and start the Vite client:

```bash
cd frontend
npm install
```

Copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_URL=http://localhost:7000`, then run:

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

Set `VITE_API_URL` in the frontend deployment environment to the deployed API URL. Set `FRONTEND_URLS` (a comma-separated list of exact frontend origins), `PORT`, `MONGO_URI`, Cloudinary credentials, and JWT/cookie settings in the backend environment or hosting provider. Cross-site authentication cookies require HTTPS in production.

## Project layout

```text
backend/   Express API, MongoDB models, authentication, and blog/user routes
frontend/  React application, routes, UI components, and Tailwind styles
```
