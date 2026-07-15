# Use the official Node.js LTS release (slim alpine variant for a smaller image size)
FROM node:20-alpine

# Create and set the working directory
WORKDIR /app

# Copy dependency definitions first to leverage Docker build cache
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy the rest of the application source code
COPY . .

# Create the uploads directory for resume uploads (ignored by git but needed by Multer)
RUN mkdir -p uploads

# Expose the application port
EXPOSE 5000

# Set environment variables defaults
ENV PORT=5000
ENV NODE_ENV=production

# Define entrypoint
CMD ["node", "server.js"]
