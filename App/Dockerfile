FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

ENV PORT=8080

COPY . .

EXPOSE 8080

CMD ["npm", "start"]