# SECELT Conecta

Portal e aplicativo Android de esporte, cultura, lazer e turismo de São Miguel do Guamá (PA). Projeto acadêmico do TCC I.

## Executar localmente

Com Node.js 24, execute na raiz e acesse [localhost:4173](http://localhost:4173).

```sh
npm --prefix web ci --ignore-scripts
npm --prefix web run build
node server.js
```

Testes com `node --test tests/*.test.mjs`. No site, abra **Baixar app** para baixar o APK Android.

## Mapa do código

| Pasta | Conteúdo |
| --- | --- |
| [`web/src`](web/src) | Entrada React em `main.jsx`, navegação em `app/` e telas em `features/` |
| [`server`](server) | Rotas HTTP e regras da API |
| [`database`](database) | Esquema e catálogo inicial do SQLite |
| [`android`](android/app/src/main/java/br/gov/secel/conecta) | App Kotlin abre o portal em WebView, com entrada pelo Feed |
| [`tests`](tests) | Testes de integração e regras do feed |

## Netlify
Acesse: https://secelt-conecta-demo.netlify.app/
