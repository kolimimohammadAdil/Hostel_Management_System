# ALTS Hostel Portal — System Architecture & Directory Structure
**Institution**: Anantha Lakshmi Institute of Technology & Sciences (ALTS)

## 1. Directory Layout

```text
ALTS-Hostel-Portal/
│
├── frontend/                  # React 19 + TypeScript + Vite + Tailwind CSS Application
│   ├── src/                   # Client application source (7 Portals, Context, Components, Pages)
│   ├── public/                # Static assets and favicons
│   ├── package.json           # Frontend dependencies and build scripts
│   ├── package-lock.json      # Frontend dependency lockfile
│   ├── vite.config.ts         # Vite bundler configuration
│   ├── tsconfig.json          # TypeScript project configuration
│   ├── tsconfig.app.json      # Client app compiler settings
│   ├── tsconfig.node.json     # Node environment compiler settings
│   └── .oxlintrc.json         # Linter rules
│
├── backend/                   # Node.js + Express + TypeScript + Mongoose Backend
│   ├── src/                   # Backend application source
│   │   ├── config/            # Database (Atlas) and Environment configuration
│   │   ├── controllers/       # Auth, Leaves, Movements, Maintenance, Notifications, Mess, Parent
│   │   ├── middleware/        # Auth (JWT), RBAC, Rate Limiting, Validation
│   │   ├── models/            # Mongoose Schemas (User, LeaveApplication, MovementLog, etc.)
│   │   ├── routes/            # Express REST endpoints
│   │   ├── scripts/           # Administrative provisioning CLI (provision-user.ts)
│   │   ├── services/          # Real-time Socket.IO and Biometrics integration
│   │   ├── utils/             # Helper utilities and token signing
│   │   ├── app.ts             # Express application setup
│   │   └── server.ts          # HTTP server & WebSocket bootstrap
│   ├── package.json           # Backend dependencies and scripts
│   ├── package-lock.json      # Backend dependency lockfile
│   ├── tsconfig.json          # Backend TypeScript compiler settings
│   ├── .env                   # Environment secrets (MONGODB_URI, JWT_SECRET, etc.)
│   ├── .env.example           # Example environment template
│   └── dist/                  # Compiled production JavaScript
│
├── face_service/              # OpenCV Deep Learning Face Recognition Microservice
│   ├── models/                # YuNet CNN detector & SFace ResNet 128-D ONNX weights
│   ├── download_models.py     # Automated ONNX model downloader
│   └── service.py             # Flask HTTP microservice (Port 5001)
│
├── scripts/                   # Workspace-level orchestration scripts
│   └── dev.mjs                # Concurrent multi-service development launcher
│
├── documentation/             # System and architectural documentation
│   ├── ARCHITECTURE.md        # Technical architecture and directory guide
│   └── PORTALS_AND_CREDENTIALS.md # Portal roles and access credentials
│
├── package.json               # Root workspace orchestrator
├── .gitignore                 # Exclusion rules for Git
└── README.md                  # Quickstart and overview
```

## 2. Port Assignments & Network Map

| Service | Port | Base URL | Health Check Endpoint |
| :--- | :---: | :--- | :--- |
| **Frontend Web App** | `5173` | `http://localhost:5173` | `http://localhost:5173/login` |
| **Backend REST & WebSocket** | `5000` | `http://localhost:5000` | `http://localhost:5000/api/health` |
| **Face Biometrics Microservice** | `5001` | `http://127.0.0.1:5001` | `http://127.0.0.1:5001/health` |
| **Database** | `27017` / Atlas | MongoDB Atlas Cluster | Monitored in backend health |

