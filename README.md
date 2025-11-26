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
# Si tienes Python
python -m http.server 5500
# Luego abre http://localhost:5500/e:/jvelasquez/Codigos/proyectos/pedidos/index.html

# O con Node.js
npx serve e:\jvelasquez\Codigos\proyectos\pedidos -l 5500
# Luego abre http://localhost:5500
```

## Notas
- Todo se guarda localmente en el navegador. Para limpiar, borra el `localStorage` o usa el botón "Limpiar Rotación" para esa sección.
- El diseño es responsive y funciona en móviles y escritorio.
- Los botones de "Guardar/Abrir archivo" requieren un contexto seguro (https o localhost) y un navegador compatible (Chrome/Edge). Si no está disponible, usa Exportar/Importar JSON.
