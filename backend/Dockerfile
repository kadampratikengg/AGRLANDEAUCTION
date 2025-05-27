FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Expose backend port (e.g., 3000)
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
