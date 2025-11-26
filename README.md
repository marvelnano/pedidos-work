# Gestión de Pedidos (HTML/CSS/JS)

Sistema ligero para gestionar:
- Personas (participantes) con estado activo/inactivo.
- Responsables de compra por rotación semanal (L-V).
- Pedidos por persona (descripción, cantidad, precio, total).
 - Productos: nueva sección para registrar productos frecuentes y reutilizarlos al crear pedidos.

Datos persistidos en `localStorage` mediante `data.js`.

## Estructura
- `index.html`: Vista principal con 3 pestañas.
- `styles.css`: Tema oscuro moderno, responsive.
- `data.js`: Módulo de persistencia y CRUD.
- `app.js`: Lógica de UI y eventos.

## Uso
1. Abrir `index.html` en el navegador.
2. Pestaña Personas: agregar/editar/eliminar. El campo "Límite sugerido" es informativo (no restringe).
3. Pestaña Responsable: pulsar "Rotar Semana (L-V)" para asignaciones automáticas circulares.
4. Pestaña Pedidos: agregar/editar/eliminar; filtros por persona, texto y rango de precios.
5. Pestaña Productos: agregar/editar/eliminar productos frecuentes. En "Agregar Pedido" puedes seleccionar un producto para autocompletar descripción y precio.

### Guardar en archivo
- Exportar/Importar JSON: usa los botones del header para descargar un `.json` y luego volver a cargarlo.
- Guardar/Abrir archivo (File System Access): disponible en Chrome/Edge bajo `https` o `http://localhost`. Permite guardar directamente sobre el mismo archivo.

Para servir en `localhost` rápidamente:

```powershell
# Si tienes Python (ejecuta dentro de la carpeta del proyecto)
Push-Location "e:\...\Codigos\proyectos\pedidos-work"
python -m http.server 5500
# Luego abre http://localhost:5500

# O con Node.js
npx serve -l 5500 "e:\...\Codigos\proyectos\pedidos-work"
# Luego abre http://localhost:5500
```

## Deploy (GitHub Pages)
- Habilita Pages: en GitHub ve a `Settings` > `Pages`.
- En "Build and deployment" elige "Deploy from a branch".
- Selecciona `main` y carpeta `/ (root)` y guarda.
- Espera 1-3 minutos hasta ver el despliegue.

URL pública (una vez activo):

```
https://marvelnano.github.io/pedidos-work/
```

Notas:
- Este proyecto usa rutas relativas (por ejemplo `styles.css`, `app.js`), por lo que funciona bien bajo `/pedidos-work/`.
- Activa "Enforce HTTPS" en la misma página de Pages.
- Si deseas dominio propio, configura `CNAME` en `Settings > Pages` y crea un registro DNS `CNAME` apuntando a `marvelnano.github.io`.

## Notas
- Todo se guarda localmente en el navegador. Para limpiar, borra el `localStorage` o usa el botón "Limpiar Rotación" para esa sección.
- El diseño es responsive y funciona en móviles y escritorio.
- Los botones de "Guardar/Abrir archivo" requieren un contexto seguro (https o localhost) y un navegador compatible (Chrome/Edge). Si no está disponible, usa Exportar/Importar JSON.
