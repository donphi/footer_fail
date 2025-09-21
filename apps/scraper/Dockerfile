FROM mcr.microsoft.com/playwright:v1.47.0-jammy
WORKDIR /app
COPY package.json ./
RUN npm install && npx playwright install --with-deps chromium
COPY . .
RUN npm run build
CMD ["node", "dist/scrape.js"]