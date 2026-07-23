FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

# --ignore-scripts: postinstall (prisma generate) впаде тут, бо prisma/schema.prisma
# ще не скопійована. Клієнт генерується нижче, після COPY . .
RUN npm ci --ignore-scripts

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]
