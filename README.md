# Secure Notepad Assessment Platform

A comprehensive platform for conducting secure online assessments with anti-cheating measures including copy-paste prevention and tab switching detection.

## Features

### Student Features
- Secure login/registration system
- Take assessments in a secure environment
- View assessment history and evaluation results
- Anti-cheating measures:
  - Copy/paste prevention
  - Tab switching detection
  - Context menu disabling

### Admin Features
- Create, edit, and delete assessments
- Review student submissions
- Provide grades and feedback
- Monitor student activity

## Tech Stack

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- JWT for authentication
- RESTful API design

### Frontend
- React with TypeScript
- React Router for navigation
- TailwindCSS for styling
- Context API for state management

## Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
```
git clone <repository-url>
```

2. Install backend dependencies
```
cd backend
npm install
```

3. Create a .env file in the backend directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/secure-notepad
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=7d
```

4. Install frontend dependencies
```
cd ../frontend
npm install
```

5. Start the backend server
```
cd ../backend
npm run dev
```

6. Start the frontend development server
```
cd ../frontend
npm run dev
```

7. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## Usage

### Admin Setup
1. Register an admin account at `/admin-register`
2. Create assessments from the admin dashboard
3. Review and evaluate submissions

### Student Usage
1. Register a student account at `/register`
2. View available assessments on the dashboard
3. Take assessments in the secure environment
4. View submitted assessments and feedback

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Secure input fields
- Role-based access control
- Protection against tab switching
- Copy-paste prevention
- Context menu disabling