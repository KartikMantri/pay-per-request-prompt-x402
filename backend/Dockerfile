# Use Node 18
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port (Internal)
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
