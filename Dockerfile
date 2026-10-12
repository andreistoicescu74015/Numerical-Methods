# Serverul Vite in container: http://localhost:5173, cu reincarcare la salvare.
# Sursele vin prin volum (compose.yaml); VITE_POLL=1 fiindca evenimentele de fisier
# nu trec prin volumul montat de pe Windows.
FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV VITE_POLL=1
EXPOSE 5173
CMD ["npm", "run", "dev"]
