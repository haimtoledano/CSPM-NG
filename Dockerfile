# Stage 1: Build the React Application
FROM node:20-slim as builder

WORKDIR /app

# קבלת ה-API Key כארגומנט בזמן הבנייה והגדרתו כמשתנה סביבה
ARG API_KEY
ENV API_KEY=$API_KEY

COPY package*.json ./
RUN npm install

COPY . .

# בניית הפרויקט לתיקיית dist
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# העתקת קבצי ה-Build מהשלב הקודם לתיקייה של Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# העתקת קונפיגורציית Nginx שלנו
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
