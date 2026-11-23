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
| [`android`](android/app/src/main/java/br/gov/secel/conecta) | `MainActivity.kt` coordena as telas em `ui/screens/` |
| [`tests`](tests) | Testes de integração e regras do feed |

## Netlify

Importe este repositório do GitHub com a branch `main`. O `netlify.toml` configura o build, o catálogo público de demonstração e o download do APK. No Android, informe o endereço do site em **Conexão do sistema**.

Para usar o painel e receber inscrições online, hospede a API com armazenamento persistente e configure `SECELT_API_ORIGIN` no Netlify.
