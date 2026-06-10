# Porra Mundial 2026 · Connector ⚽

Porra del Mundial 2026 para **Connector Startup Accelerator**. Independiente de la porra
familiar (repo, web y base de datos propios). Misma mecánica y diseño, con **una diferencia
clave**: la fase de grupos se predice con **marcador exacto** de cada partido.

## Qué la hace distinta

- **Marcadores exactos** de los **72 partidos** de fase de grupos. La clasificación de
  cada grupo (1º–4º) y los 8 mejores terceros se **calculan solos** a partir de tus marcadores.
- **Puntuación de marcadores** (por partido, niveles excluyentes):
  - Marcador **exacto** → `exact` (3 pts por defecto)
  - **Resultado + diferencia** de goles exacta → `gd` (2 pts)
  - Solo la **tendencia** (1/X/2) → `result` (1 pt)
- Encima se mantiene todo lo demás: aciertos de posición de grupo, terceros que clasifican,
  cuadro de eliminatorias (1/16 → campeón) y predicciones especiales.

## Stack

Estático, sin build (Alpine.js + `@supabase/supabase-js` por CDN) sobre GitHub Pages.
Backend en Supabase: tablas/funciones `porra_*` (RLS cerrado, RPCs `SECURITY DEFINER`).
Probabilidad de ganar en vivo: Edge Function `porra-prob` (Deno) que importa el motor como
módulo ES desde jsDelivr y corre una simulación Monte Carlo.

## Ficheros

- `engine.js` — motor de cálculo (navegador + Node). Tests en `test.js` (`node test.js`).
- `engine-esm.js` — **generado** por `build-esm.js` a partir de `engine.js` + `data.js`
  (es el motor que usa la Edge Function; mantenerlos sincronizados ejecutando `node build-esm.js`).
- `data.js` — datos verificados del Mundial 2026 + puntuación por defecto.
- `app.js` — app Alpine. `index.html` / `styles.css` — interfaz.
- `supabase/functions/porra-prob/` — Edge Function de probabilidades.

## Desarrollo

```bash
node test.js        # tests del motor
node build-esm.js   # regenerar engine-esm.js tras tocar engine.js/data.js
```
