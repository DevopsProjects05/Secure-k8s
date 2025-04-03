FROM node:16-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json from the src directory
COPY package.json ./
RUN npm install

# Copy the full application source code from src
COPY . .

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
