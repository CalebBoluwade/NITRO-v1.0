FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global

ENV PATH=$PATH:/home/node/.npm-global/bin 
# optionally if you want to run npm global bin without specifying path

#RUN npm install prettier -g

RUN npm install --production
# RUN npm ci --omit=dev
#RUN npm ci --only=production

COPY . .

# RUN npm run build

EXPOSE 5000

CMD [ "npm", "run", "prod"]

#docker build -t KeySupport:1.0.0 .
# docker build . -t cboluwade/nitro

#docker images

#docker run -p 443:7140/tcp -d NITRO

# -d desktop (background)
# -e "NODE_ENV=production"

#docker ps -a
# docker images

# Get container ID
# docker ps

# Print app output
# docker logs <container id>
# docker logs -f NITRO

# Example
# Running on http://localhost:8080

#docker stop