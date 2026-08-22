# 🖥️ Task Manager — Frontend

A modern **React + Vite** single-page application for managing tasks, projects, teams, and documents — with real-time updates via **Socket.IO** and a rich UI powered by **Chakra UI** and **Framer Motion**.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | UI library |
| Vite 7 | Build tool & dev server |
| React Router DOM v7 | Client-side routing |
| Chakra UI v2 | Component library |
| Framer Motion | Animations |
| Axios | HTTP client |
| Socket.IO Client | Real-time communication |
| Formik + Yup | Form management & validation |
| React Hook Form | Alternative form handling |
| React Select | Advanced dropdown components |
| CKEditor 5 | Rich text editor |
| html2pdf.js | PDF export |
| React Icons | Icon library |
| Lodash | Utility functions |

---

## 📁 Project Structure

```
frontend/
├── index.html              # HTML entry point
├── vite.config.js          # Vite configuration
├── eslint.config.js        # ESLint configuration
├── package.json
├── .env                    # Environment variables (not committed)
├── .gitignore
└── src/
    ├── main.jsx            # React app entry point
    ├── App.jsx             # Root component with routing
    ├── index.css           # Global styles
    ├── App.css
    ├── api/                # Axios API instance & endpoint functions
    ├── assets/             # Static assets (images, icons)
    ├── components/         # Reusable UI components
    ├── config/             # App-level configuration (axios base URL, etc.)
    ├── constants/          # App constants & enums
    ├── context/            # React Context providers (Auth, Theme, etc.)
    ├── hooks/              # Custom React hooks
    ├── pages/              # Page-level components
    │   ├── auth/           # Login, Register, Forgot Password
    │   ├── dashboard/      # Dashboard page
    │   ├── tasks/          # Task management pages
    │   ├── projects/       # Project pages
    │   ├── staff/          # Staff management
    │   ├── team/           # Team pages
    │   ├── roles/          # Role management
    │   ├── permissions/    # Permission management
    │   ├── companies/      # Company management
    │   ├── subscriptions/  # Subscription pages
    │   ├── documents/      # Document pages
    │   ├── taskStatus/     # Task status pages
    │   ├── Profile/        # User profile page
    │   └── notfound/       # 404 page
    ├── routes/             # Route definitions & protected routes
    ├── theme/              # Chakra UI theme customization
    └── utils/              # Helper functions
```

---

## ⚙️ Prerequisites

Make sure you have the following installed on your machine:

- **Node.js** v18 or higher → [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git**
- The **Backend** server must be running before starting the frontend

---

## 🚀 Setup & Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Task_manager/frontend
```

### 2. Install Dependencies

```bash
npm install
```

> ⚠️ This project has several large dependencies (CKEditor, Framer Motion, etc.). Installation may take a few minutes.

---

### 3. Create the `.env` File

Create a `.env` file in the `frontend/` root directory:

```env
# Frontend URL
VITE_FRONTEND_URL=http://localhost:5173

# Backend API Base URL
VITE_API_URL=http://localhost:5000/api
```

> **📝 Note:**
> - All environment variables must start with `VITE_` to be accessible inside the React app.
> - Update `VITE_API_URL` to your deployed backend URL when deploying to production.
> - Never commit your `.env` file to GitHub. It is already listed in `.gitignore`.

---

### 4. Make Sure the Backend is Running

The frontend depends on the backend API. Start the backend first:

```bash
# In the backend/ directory
npm run dev
```

Backend should be running at **http://localhost:5000**

---

### 5. Run the Development Server

```bash
npm run dev
```

The app will open at: **http://localhost:5173**

---

### 6. Build for Production

```bash
npm run build
```

The optimized build output will be in the `dist/` folder.

---

### 7. Preview the Production Build

```bash
npm run preview
```

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server with HMR |
| `npm run build` | Build the app for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint to check for code issues |

---

## 🔐 Default Login (After Backend Seeding)

After the backend seeds the Super Admin on first start, use these credentials to log in:

| Field | Value |
|---|---|
| **Email** | The `SUPER_ADMIN_EMAIL` set in backend `.env` |
| **Password** | The `SUPER_ADMIN_PASSWORD` set in backend `.env` |

---

## 🌐 Real-Time Features (Socket.IO)

The frontend connects to the backend via **Socket.IO** for real-time updates such as task notifications and live activity. The Socket.IO client connects to the backend URL (same host as the API, port `5000`).

---

## 🌍 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `VITE_FRONTEND_URL` | ✅ | The URL of this frontend app |
| `VITE_API_URL` | ✅ | The backend API base URL (e.g., `http://localhost:5000/api`) |

---

## 📦 Key Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react` | ^19.2.0 | Core UI library |
| `vite` | ^7.3.1 | Build tool |
| `@chakra-ui/react` | ^2.10.9 | UI components |
| `framer-motion` | ^12.34.0 | Animations |
| `react-router-dom` | ^7.13.0 | Routing |
| `axios` | ^1.13.5 | API requests |
| `socket.io-client` | ^4.8.3 | Real-time |
| `formik` | ^2.4.9 | Form handling |
| `yup` | ^1.7.1 | Form validation |
| `ckeditor5` | ^48.0.0 | Rich text editor |
| `html2pdf.js` | ^0.14.0 | PDF export |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is private.
