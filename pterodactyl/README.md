# NOVUS sur Pterodactyl

## Image recommandée

Utilise une image Pterodactyl Node.js avec **Node.js 20 ou plus récent**.

## Installation / Startup

Dans le champ **Startup Command** de ton serveur Pterodactyl :

```bash
npm install --omit=dev && npm start
```

> Si ton egg installe déjà les dépendances automatiquement, `npm start` suffit.

## Port

Dans Pterodactyl, crée une allocation pour le serveur et expose le port attribué. Le serveur NOVUS écoute sur :

- `0.0.0.0`
- `SERVER_PORT` si cette variable existe ; sinon `PORT` ; sinon `3000`

Le plus simple est de laisser Pterodactyl fournir `SERVER_PORT` ou `PORT`.

## Fichiers nécessaires

```text
package.json
server.js
index.html
src/
vite.config.js
```

Le dossier `dist/` est généré automatiquement par `npm run build`.

## Commandes

```bash
npm install --omit=dev
npm start
```

`npm start` construit le site puis démarre le serveur HTTP.

## Vérification

Les logs doivent afficher quelque chose comme :

```text
NOVUS listening on 0.0.0.0:XXXX
```

où `XXXX` correspond au port attribué par Pterodactyl.
