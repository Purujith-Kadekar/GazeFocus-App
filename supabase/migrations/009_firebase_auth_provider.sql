-- Add Firebase as a valid authProvider value
ALTER TABLE "User"
ADD CONSTRAINT "authProvider_valid" CHECK ("authProvider" IN ('google', 'credentials', 'firebase'));