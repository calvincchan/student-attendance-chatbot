# Use the official Node 18 image as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package.json yarn.lock data/ entity/ ./

# Install dependencies
RUN yarn install

# Copy the rest of the application code to the working directory
COPY dist/* .

# Expose the port your application will run on
EXPOSE 3001

# Define the command to run your application
CMD ["node", "index.js"]
