# Use official Node.js image
FROM node:24-slim

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
# Copy package.json and package-lock.json
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY . .

# Expose port (Cloud Run sets PORT env var)
EXPOSE 8080

# Start
CMD [ "npm", "start" ]
