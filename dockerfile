# Use the official Node 18 image as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package and tsconfig to the working directory
COPY package.json yarn.lock tsconfig.json ./

# Install dependencies
RUN yarn install

# Copy the source code to the working directory
COPY data ./data
COPY src ./src
COPY frontend ./frontend
RUN cd frontend && yarn install && yarn build && cd ..

# Expose the port your application will run on
EXPOSE 3001

# Define the command to run your application
CMD ["yarn", "start"]
