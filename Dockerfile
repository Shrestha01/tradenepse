# Use the correct Playwright image
FROM ://microsoft.com

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy your code
COPY . .

# Build your Next.js app
RUN npm run build

# Start the app
EXPOSE 10000
CMD ["npm", "start"]
