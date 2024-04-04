FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000

CMD ["npm", "start"]



#FROM node:18 as build
#WORKDIR /app
#COPY package*.json ./
#RUN npm install -g bun
#RUN bun install
#COPY . .
#RUN bun run build
#
#FROM node:18 as production
#ENV NODE_ENV=production
#WORKDIR /app
#COPY package*.json ./
#RUN npm install -g bun
#RUN bun install --only=production
#COPY --from=build /app/build ./build
#COPY --from=build /app/public ./public
#COPY --from=build /app/src ./src
#EXPOSE 3000
#CMD ["bun", "start"]
