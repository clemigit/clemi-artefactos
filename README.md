# Herramientas CLEMI

Plataformas web del equipo de comunicaciones de CLEMI. Son sitios estáticos (HTML, CSS y JavaScript), sin paso de compilación.

| Carpeta | Proyecto |
|---|---|
| `itinerarios/` | Itinerarios CLEMI |
| (externo) | CRONOS: se usa en https://clemi.pro/ |
| `investigacion/` | Plataforma de Investigación CLEMI |
| `salas-quirurgicas/` | CLEMI Salas Quirúrgicas (vista previa con datos de ejemplo) |
| `portafolio-inscripciones/` | Portafolio de Inscripciones CLEMI |

`index.html` en la raíz es la página de inicio que enlaza las cinco herramientas.

## Publicar con GitHub Pages

En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**. El sitio queda en `https://<usuario>.github.io/clemi-artefactos/`.

## Limitaciones fuera de claude.ai

- **Portafolio de Inscripciones** guarda inscripciones y configuración en la base de datos de claude.ai. En GitHub Pages se muestra, pero no guarda datos.
- **Salas Quirúrgicas** e **Investigación** hacen referencia a archivos `.php` del hosting de CLEMI; GitHub Pages no ejecuta PHP, así que funcionan en modo de demostración.
