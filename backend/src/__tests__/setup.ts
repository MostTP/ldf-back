process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgresql://localhost:5432/ldf_test';
process.env.JWT_SECRET = 'test-secret-min-16-chars!!';
