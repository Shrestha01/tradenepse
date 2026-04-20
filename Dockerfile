# 1. Use a pre-made image that already has Chrome/Playwright installed
FROM ://microsoft.com

WORKDIR /app

# 2. Install your project's tools
COPY package*.json ./
RUN npm install

# 3. Copy your code and build it
COPY . .
RUN npm run build

# 4. Start the app
EXPOSE 3000
CMD ["npm", "start"]
