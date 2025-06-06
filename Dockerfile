# Etapa de construção
FROM node:18 AS build

# Defina o diretório de trabalho
WORKDIR /app

# Copie os arquivos package.json e package-lock.json
COPY package*.json ./

# Instale as dependências
RUN npm install

# Copie o restante do código da aplicação
COPY . .

# Construa a aplicação
RUN npm run build

# Etapa de produção
FROM nginx:alpine

# Copie os arquivos de build para o diretório padrão do nginx
#COPY --from=build /app/build /usr/share/nginx/html
COPY --from=build /app/dist /usr/share/nginx/html

# Exponha a porta 80
EXPOSE 80

# Comando para iniciar o nginx
CMD ["nginx", "-g", "daemon off;"]
