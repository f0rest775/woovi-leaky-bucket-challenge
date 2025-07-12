# Woovi Leaky Bucket Challenge

This project implements a leaky bucket algorithm to limit transaction fees.

## Functionality

The main functionality is a transaction processing system with rate limits. It uses a leaky bucket algorithm to control the number of transactions a user can perform in a given period.

- **Leaky Bucket Algorithm**: Implemented using Redis and Lua scripts for atomicity and performance.
- Each user has a "bucket" of tokens.
- The bucket has a maximum capacity of 10 tokens.
- The bucket is replenished at a rate of 1 token per hour.
- If the bucket is empty, the transaction is rejected.
- If the transaction fails, the token is consumed; otherwise, the number of tokens is maintained.

## How to Run the Project

### Prerequisites

- Docker
- Node.js (v22 or higher)
- pnpm

### 1. Clone the Repository

```bash
git clone https://github.com/f0rest775/woovi-leaky-bucket-challenge.git
cd woovi-leaky-bucket-challenge
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Copy the `.env.example` file to a new file called `.env`.

```bash
cp .env.example .env
```

The `.env` file has the following variables:

- `PORT`: The port on which the application will run.
- `REDIS_URL`: A URL to the Redis instance.
- `JWT_SECRET`: A secret key for generating JWT tokens.

### 4. Start the Services

This project uses Docker Compose to run a Redis instance.

```bash
docker-compose up -d
```

### 5. Run the Application

To run the application in development mode with hot reloading:

```bash
pnpm dev
```

To build the application for production:

```bash
pnpm build
```

To run the application in production mode:

```bash
pnpm start
```

## API Routes

An API is prefixed with `/api`.

### Authentication

#### `POST /login`

Authenticates a user and returns a JWT token.

**Request Body:**

```json
{
  "email": "test1@test.com"
}
```

**Success Response (200):**

```json
{
  "token": "your-jwt-token"
}
```

**Error Response (401):**

```json
{
  "message": "Invalid Email"
}
```

### Transactions

All transaction routes require a valid JWT token in the `Authorization` header.

#### `POST /transaction`

Processes a transaction.

**Request Body:**

```json
{
  "quantity": 5000,
  "pixKey": "recipient-pix-key"
}
```

**Success Response (200):**

```json
{
  "message": "Transaction completed successfully.",
  "tokens": 10,
  "last top-up": "2025-07-11T10:00:00.000Z"
}
```

**Error Responses:**

- **400 (Bad Request):** If the transaction amount exceeds the maximum allowed amount.
- **404 (Not Found):** If the `pixKey` is invalid.
- **429 (Too Many Requests):** If the user has reached the transaction limit.
- **500 (Internal Server Error):** If an unexpected error occurs.

## How to run tests

To run the test suite:

```bash
pnpm test
```
