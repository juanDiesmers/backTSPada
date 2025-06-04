# Pruebas

Este directorio contiene las pruebas automáticas del proyecto.
A continuación se describe brevemente qué cubre cada archivo:

- **api.test.ts**: pruebas de integración de los endpoints principales. Comprueba
  la respuesta de `/api/health`, la carga de archivos OSM y de puntos y la
  ejecución del TSP.
- **networkController.test.ts**: prueba unitaria de `processNetworkFile`,
  asegurando que un JSON de red se transforma correctamente.
- **uploadLimit.test.ts**: verifica que la configuración `UPLOAD_LIMIT_MB` limita
  el tamaño permitido para subir archivos.
- **osmParser.test.ts**: prueba de la utilidad `parseOSM` para extraer nodos y
  aristas con distancia calculada desde un archivo OSM.
- **pointsRoutes.test.ts**: comprueba que `/api/points/upload-points` devuelve un
  error si no se ha cargado la malla antes.
- **networkRoutesErrors.test.ts**: contiene casos de validación para
  `/api/network/upload-osm` cuando no se envía archivo o está vacío.
