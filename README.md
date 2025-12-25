# Gym Hub Backend API

Backend REST API for Gym Hub mobile application built with Node.js, Express, and MongoDB.

## Features

- ✅ User authentication with JWT
- ✅ Client management (CRUD)
- ✅ Automatic receipt generation
- ✅ Subscription management
- ✅ MongoDB database
- ✅ RESTful API endpoints

## Installation

```bash
cd backend
npm install
```

## Running the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Clients

- `GET /api/clients` - Get all clients (requires auth)
- `POST /api/clients` - Add new client (requires auth)
- `PUT /api/clients/:id` - Update client (requires auth)
- `DELETE /api/clients/:id` - Delete client (requires auth)
- `POST /api/clients/:id/renew` - Renew membership (requires auth)

### Receipts

- `GET /api/receipts` - Get all receipts (requires auth)
- `GET /api/receipts/:id` - Get receipt by ID (requires auth)
- `GET /api/receipts/client/:clientId` - Get client receipts (requires auth)

### Subscription

- `GET /api/subscription` - Get user subscription (requires auth)
- `PUT /api/subscription` - Update subscription (requires auth)
- `GET /api/subscription/can-add-client` - Check client limit (requires auth)

## Environment Variables

Create a `.env` file in the backend directory:

```
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/gym_hub?retryWrites=true&w=majority
NODE_ENV=development
```

## Database

This project uses MongoDB (via Mongoose). Make sure to set `MONGODB_URI` in `.env`.

### Models

- `User` - User accounts
- `Client` - Gym clients
- `Receipt` - Payment receipts
- `Subscription` - User subscription plans
- `SuperAdmin` - Super admin accounts

## Testing the API

Use Postman, Insomnia, or curl to test endpoints:

```bash
# Health check
curl http://localhost:3000/health

# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── clientController.js
│   │   ├── receiptController.js
│   │   ├── subscriptionController.js
│   │   └── superAdminController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Client.js
│   │   ├── Receipt.js
│   │   ├── Subscription.js
│   │   ├── SuperAdmin.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── clients.js
│   │   ├── receipts.js
│   │   ├── subscription.js
│   │   └── superAdmin.js
│   └── server.js
├── .env
├── package.json
└── README.md
```
