# Ensure this is line 1 or 2 of your Dockerfile
FROM ://microsoft.com

WORKDIR /app

# The rest of your Dockerfile...
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
