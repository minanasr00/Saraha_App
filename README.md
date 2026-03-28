# Saraha API (Node.js Backend)

A lightweight, learning-focused backend application for Saraha-style anonymous messaging built with Node.js, Express, MongoDB, and Redis.

## ✅ Features

- User registration and login (JWT-based).
- Anonymous messaging between users.
- File upload support for profile and cover images (multer).
- Input validation with Joi.
- Security headers with Helmet.
- Rate limiting via express-rate-limit.
- Redis integration for caching/session handling.
- Centralized error responses and structured API for success/error.

## 📁 Project Structure

- `src/index.js` — Express app bootstrap and server start.
- `src/modules/user` — User controller, service, validation.
- `src/modules/message` — Message controller, service, validation.
- `src/middleWares` — Authentication + validation middleware.
- `src/common` — Shared enums, responses, security utilities, file upload config.
- `src/db` — MongoDB and Redis connections + model definitions.
- `uploads/` — Saved files for messages, user profile/cover.

## ⚙️ Requirements

- Node.js 24.x (configured via `package.json` engines)
- MongoDB
- Redis

## 🚀 Install

```bash
npm install
```

## 🛠️ Run

Dev mode (auto-reload):

```bash
npm run start:dev
```

Production mode:

```bash
npm run start
```

## 📡 Environment Variables

Create a `.env` file in project root if not already existing, with keys like:

- `PORT`
- `MONGO_URI`
- `REDIS_URL` / `REDIS_PORT` / `REDIS_HOST`
- `JWT_SECRET`
- `EMAIL_USER` / `EMAIL_PASS` (if email notifications used)

## 🧩 API Endpoints (assumed paths)

### User
- `POST /api/v1/users/register` — register new user
- `POST /api/v1/users/login` — login and get JWT
- `GET /api/v1/users/me` — get current user (auth required)
- `PATCH /api/v1/users/profile` — update profile + upload images

### Messages
- `POST /api/v1/messages` — send message
- `GET /api/v1/messages` — get messages (incoming/outgoing)

> Note: route paths might be under modules or prefix from `src/modules/index.js`.

## 🔐 Security

- Request validation on schemas
- JWT token validation in `authentication.middleware.js`
- File upload file type validation in `common/utils/multer/validation.multer.js`

## 📌 Notes

- Make sure MongoDB and Redis are running before starting.
- `uploads/` directory should be writable by the app.
- Consider environment-specific config in `config/config.service.js`.

## 🤝 Contribution

1. Fork
2. Create branch `feat/xxx`
3. Add code + tests
4. PR with description

---

Built by Mina Nasr as a backend learning assignment.
