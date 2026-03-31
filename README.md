# RevealMe - Anonymous Messaging Platform

A full-stack anonymous messaging application featuring a Node.js backend API and a modern React frontend with premium UI/UX design.

## 🏗️ Architecture

- **Backend**: Node.js/Express API with MongoDB and Redis
- **Frontend**: React 18 with Vite, Tailwind CSS, and glassmorphism design

## 🔧 Backend Features

- User registration and login (JWT-based authentication)
- Anonymous messaging between users
- File upload support for profile and cover images (multer)
- Input validation with Joi
- Security headers with Helmet
- Rate limiting via express-rate-limit
- Redis integration for caching/session handling
- Centralized error responses and structured API

## 🎨 Frontend Features

- **Modern UI/UX**: Premium glassmorphism design with animated backgrounds and gradients
- **User Authentication**: Login, signup, email verification, and forgot password with OTP
- **Messaging System**: Send and receive anonymous messages with rich content support
- **Profile Management**: User profiles with cover images, profile pictures, and bio
- **Interactive Dashboard**: View sent/received messages with clickable modals for detailed view
- **Responsive Design**: Mobile-friendly interface with smooth animations
- **Real-time Features**: Toast notifications and loading states

## 📁 Project Structure

### Backend (`code/`)
- `src/index.js` — Express app bootstrap and server start
- `src/modules/user` — User controller, service, validation
- `src/modules/message` — Message controller, service, validation
- `src/middleWares` — Authentication + validation middleware
- `src/common` — Shared enums, responses, security utilities, file upload config
- `src/db` — MongoDB and Redis connections + model definitions
- `uploads/` — Saved files for messages, user profile/cover

### Frontend (`frontEnd/`)
- `src/pages/` — Main application pages (Dashboard, Login, Signup, etc.)
- `src/contexts/` — React contexts for authentication and state management
- `src/components/` — Reusable UI components
- `public/` — Static assets
- `dist/` — Build output (ignored in git)

## ⚙️ Requirements

- **Backend**: Node.js 24.x, MongoDB, Redis
- **Frontend**: Node.js 18+, npm

## 🚀 Installation & Setup

### Backend Setup
```bash
cd code
npm install
# Configure environment variables in config/.env.development
npm run start:dev  # Development mode
```

### Frontend Setup
```bash
cd frontEnd
npm install
# Configure VITE_API_BASE_URL in .env
npm run dev  # Development server
npm run build  # Production build
```

## 🛠️ Available Scripts

### Backend
- `npm run start:dev` — Start development server with auto-reload
- `npm run start` — Start production server

### Frontend
- `npm run dev` — Start Vite development server
- `npm run build` — Build for production
- `npm run preview` — Preview production build

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
