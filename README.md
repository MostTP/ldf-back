# Node.js with Prisma ORM - LDF Registration API

This project provides a secure registration endpoint for the LDF Digital Masterclass platform.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate Prisma Client:
   ```bash
   npm run prisma:generate
   ```

3. Push schema to database (or create migration):
   ```bash
   npm run prisma:push
   # OR
   npm run prisma:migrate
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

### POST `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+2348012345678",
  "username": "johndoe123",
  "bankName": "First Bank",
  "bankAccount": "1234567890",
  "sponsor": "sponsor123",
  "couponCode": "COUPON123",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "termsAccepted": "true",
  "riskDisclosureAccepted": "true",
  "couponAcknowledged": "true"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Account created and activated successfully",
  "user": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "username": "johndoe123",
    "createdAt": "2024-12-03T15:00:00.000Z"
  }
}
```

**Error Response (400/409):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [...]
}
```

### POST `/api/auth/login`

Login with email or username.

**Request Body:**
```json
{
  "identifier": "john@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "username": "johndoe123",
    "phone": "+2348012345678",
    "createdAt": "2024-12-03T15:00:00.000Z"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid email/username or password"
}
```

**Note:** The `identifier` field accepts either email address or username.

## Security Features

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ Input validation and sanitization
- ✅ SQL injection protection (via Prisma)
- ✅ Duplicate user detection (email, username, phone)
- ✅ Password strength requirements
- ✅ Security headers (XSS protection, content type sniffing prevention)
- ✅ No sensitive data in responses (password hash excluded)
- ✅ Secure password verification with bcrypt comparison
- ✅ Generic error messages to prevent user enumeration

## Validation Rules

- **Username**: 6-15 characters, alphanumeric and underscores only
- **Password**: Minimum 8 characters, must contain uppercase, lowercase, and number
- **Email**: Valid email format
- **Phone**: Valid phone number format
- **Bank Account**: Numbers only
- **All required fields**: Must be provided
- **Legal checkboxes**: Must be accepted

## Database

The project uses PostgreSQL. Update the `DATABASE_URL` in `.env` to connect to your database.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Create and apply database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:push` - Push schema changes to database without migrations
