
# 📃 Guía de tests

Este directorio recopila todas las pruebas automáticas del proyecto. Están escritas con **Jest** y **Supertest**. Para ejecutarlas simplemente usa:

```bash
npm test
```

A continuación se detalla qué verifica cada archivo y qué se espera de los resultados.

## api.test.ts
Prueba de integración de los endpoints principales.

Se espera:
- `GET /api/health` responda **200** y `{"status":"OK"}`.
- `POST /api/network/upload-osm` suba un OSM de ejemplo y devuelva **200** con varias **features**.
- `POST /api/points/upload-points` cargue los puntos y responda **200** con dos puntos cargados.
- `GET /api/network/tsp?type=nearest` regrese **200** con un arreglo `path` que representa la solución del TSP.

## networkController.test.ts
Prueba unitaria de `processNetworkFile`. Valida que al proporcionar un JSON de red se obtengan
`nodes` y `edges` correctamente formados.

## uploadLimit.test.ts
Fuerza la variable `UPLOAD_LIMIT_MB` a un valor muy pequeño para comprobar que el servidor
devuelve **413** (payload too large) cuando se intenta subir un archivo grande.

## osmParser.test.ts
Ejercita la utilidad `parseOSM` extrayendo nodos y aristas de un archivo OSM de ejemplo. Se esperan
**4 nodos** y **6 aristas**, con distancias calculadas alrededor de 111 km para una de ellas.

## pointsRoutes.test.ts
Comprueba el comportamiento del endpoint de subida de puntos cuando aún no se ha cargado la malla.
Debe responder **400** y un mensaje de error que mencione que no hay malla cargada.

## networkRoutesErrors.test.ts
Incluye validaciones para `/api/network/upload-osm` en escenarios erróneos.
- Si no se envía archivo debe responder **400** con un mensaje indicando que se requiere un `.osm`.
- Si el archivo está vacío se obtiene también **400** con un error de archivo vacío o malformado.
