# AI Chat Backend API

A Node.js/Express backend for an AI chat application with MongoDB, JWT authentication, and Google AI integration.

## Features

- 🔐 JWT Authentication with HTTP-only cookies
- 👤 User registration and login
- 💬 AI-powered chat with Google Gemini
- 🔒 Protected routes with middleware
- 🍪 Secure cookie-based sessions
- 📊 MongoDB database integration
- 🛡️ Password hashing with bcrypt
- 📝 Input validation and error handling

## Tech Stack

- **Runtime**: Node.js with ES modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt password hashing
- **AI**: Google Gemini AI SDK
- **Validation**: Built-in Express validation

## Installation

1. **Install dependencies:**

   ```bash
   cd server
   bun install
   ```

2. **Environment Setup:**
   Create/update `.env` file:

   ```env
   MONGODB_URI=mongodb://localhost:27017/ai-chat
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-api-key
   ```

3. **Start MongoDB:**
   Make sure MongoDB is running on your system.

4. **Run the server:**

   ```bash
   # Development mode
   bun run dev

   # Production mode
   bun run start
   ```

## API Endpoints

### Authentication Routes

#### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login User

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
# or via HTTP-only cookie
```

#### Update Profile

```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

#### Logout

```http
POST /api/auth/logout
# Clears the authentication cookie
```

### Chat Routes

#### Send Chat Message

```http
POST /api/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "Hello, how are you?"
}
```

## Response Format

All API responses follow this format:

**Success Response:**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Error description"
}
```

## Authentication

The API uses JWT tokens stored in HTTP-only cookies for authentication. Include the token in the Authorization header or rely on the cookie for automatic authentication.

### Cookie Configuration

- **httpOnly**: `true` (prevents XSS attacks)
- **secure**: `true` in production (HTTPS only)
- **sameSite**: `strict` (CSRF protection)
- **maxAge**: 7 days

## Database Schema

### User Model

```javascript
{
  name: String (required, max 50 chars),
  email: String (required, unique, lowercase),
  password: String (required, hashed, min 6 chars),
  role: String (enum: ['user', 'admin'], default: 'user'),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

The API includes comprehensive error handling for:

- Validation errors
- Authentication failures
- Database connection issues
- AI service errors
- Server errors

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token generation and verification
- **HTTP-only Cookies**: Prevents client-side token access
- **CORS Configuration**: Proper origin and credential handling
- **Input Validation**: Request body validation
- **Rate Limiting**: Can be added with middleware

## Development

### Testing Database Connection

```bash
cd server
bun run node src/test-db.js
```

### Available Scripts

- `bun run dev` - Start development server with nodemon
- `bun run start` - Start production server
- `bun run node src/test-db.js` - Test database connection

## Deployment

1. Set `NODE_ENV=production` in environment
2. Use a production MongoDB URI
3. Set strong `JWT_SECRET`
4. Configure proper CORS origins
5. Enable HTTPS for secure cookies

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include JSDoc comments for new functions
4. Test all endpoints thoroughly
5. Update this README for new features

## License

ISC License
