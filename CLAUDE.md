# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Que es esto

Landing page de **Minerva Systems** (sistema de gestion para representadoras). Todo el sitio es **un unico archivo HTML estatico y auto-contenido**: no hay framework, no hay paso de build, no hay dependencias externas en runtime.

- `Minerva Systems - landing.html` — fuente original exportada. **Este es el archivo que se edita.**
- `index.html` — copia identica de la anterior, usada como entrypoint al servir/deployar.

Si se cambia el contenido del sitio, editar el archivo fuente y luego regenerar la copia:

```bash
cp "Minerva Systems - landing.html" index.html
```

## Estructura interna del HTML

El archivo NO es HTML plano legible. Es un bundle: un `<script>` inicial (el "bundler loader") que en `DOMContentLoaded` desempaqueta assets embebidos (fuentes, imagenes como data URIs / base64), los registra via `URL.createObjectURL`, y luego monta la pagina real. Puntos a tener en cuenta:

- Muestra un thumbnail SVG de carga (`#__bundler_thumbnail`) y un indicador `#__bundler_loading` ("Unpacking...") mientras desempaqueta.
- Captura errores en `window` y los renderiza en un panel rojo fijo (`#__bundler_err`) — util para debug en el browser.
- Requiere JavaScript; hay un `<noscript>` de fallback.
- Las cadenas tipo `src="http..."` que aparecen en el archivo estan dentro de strings del bundle JS, no son requests reales a CDNs.

Editar markup/estilos a mano en este archivo es dificil por el tamaño (~2.8 MB) y el empaquetado. Para cambios de contenido reales, lo esperable es re-exportar desde la herramienta de origen y reemplazar el archivo fuente.

## Correr localmente

```bash
npm install
npm start        # sirve el directorio en http://localhost:3000 (o $PORT)
```

Alternativa sin Node: abrir `index.html` directo en el browser tambien funciona.

## Deploy (GitHub -> Railway)

Si, se puede subir "asi nomas": es un sitio estatico. El setup minimo ya esta:

- `package.json` declara `serve` como dependencia y `npm start` = `serve -s . -l $PORT`.
- Railway (Nixpacks) detecta Node, corre `npm install` y luego `npm start`. `$PORT` lo inyecta Railway.
- No hace falta Dockerfile ni `railway.json`.

Flujo: commit + push a GitHub -> en Railway "New Project" -> "Deploy from GitHub repo" -> seleccionar este repo. Deploys automaticos en cada push a la rama por defecto.
