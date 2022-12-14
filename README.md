# gestib2google

> Conversió del fitxer XML del GestIB al domini de Google

## Requisits generals

- Un navegador amb compatibilitat amb l'objecte URLSearchParams ([referència](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams))
- Crear credencials d'autorització(authorization credentials) de tipus "IDs de client de OAuth 2.0" seguint [aquest enllaç](https://console.developers.google.com/apis/credentials) i copiar els camps **client_id** i **client_secret** al fitxer `/config/gestib2google.env.js`
- Configurar el domini al fitxer `config.json` a la carpeta `/src` (hi ha exemples al propi fitxer)

## Executar amb NodeJS

Requisits:

- [Node.js](https://nodejs.org/)

```bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report

# run unit tests
npm run unit

# run all tests
npm test
```

For a detailed explanation on how things work, check out the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).

## Desplegar a www.gestib2google.com

Per desplegar a [www.gestib2google.com](https://www.gestib2google.com)

```bash
./deploy.sh
```

## Executar amb Docker

Requisits:

- [Docker](https://docs.docker.com/install/)

Per executar el contenidor:

```
docker-compose up -d
```

Per aturar i eliminar el contenidor:

```
docker-compose down
```

Per anar a l'aplicació web, s'ha d'obrir l'adreça [http://localhost:8080](http://localhost:8080)

## Darreres modificacions i millores

- Afegides noves cerques d'usuaris amb diferents filtres dins la vista usuaris del domini
- Afegit enllaç l'admin.google.com a partir de l'email de l'usuari per poder corregir errors
- Millora feta a l'alta d'usuari: afegeix l'usuari als grups que ha de ser membre.
- Millora feta al suspendre un usuari: l'eliminia dels grups que pertany i el canvia a l'unitat organitzativa ExAlumnat o Exprofessorat segons el cas
- Nova vista per fer operacions massives amb els usuaris. Com purga dels usuaris desactivats que encara estan dins grups

## Crèdits

Basat en el tema [Start Bootstrap SB Admin 2](https://github.com/BlackrockDigital/startbootstrap-sb-admin-2)
