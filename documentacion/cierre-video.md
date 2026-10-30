# Cierre de documentación de video — JACSA Gestión

**Fecha del cierre:** 2026-10-30 UTC. **Estado:** documentación y cuatro Word regenerados y validados estructuralmente. No es un ensayo humano ni una grabación; no se produjo MP4. Este documento resume la entrega y separa la validación automática de la revisión visual y grabación pendientes.

## 1. Alcance del ajuste

Se aplicó un ajuste final de locución, no un rediseño del video ni de la aplicación:

- **B4:** desde «Al guardar, el pedido pasa a Listo…» hasta el final de la locución se sustituyó por «Al guardar, el pedido pasa a Listo, con el avance completo y el control de calidad registrado.» Se conservaron las acciones previas: abrir la cola, iniciar la producción, cargar 288 unidades y registrar el control de calidad.
- **B5:** «Abre Mis avisos» se sustituyó por «Se desplaza a Mis avisos», porque Mis avisos es una sección del portal y no una acción de apertura.
- **Consumo y saldo:** las cifras 576/288 g y 24/12 g se conservan en la guía, el storyboard y el JSON de QA como verificación de estado. **No forman parte de la locución de B4.**
- **Referencias visuales de B4:** las capturas y el montaje se limitan a la cola del operario y al pedido Listo. No se inventan cifras de inventario en esa pantalla; el saldo se verifica en el JSON.

No se modificaron la aplicación, sus tests ni sus paquetes. La entrega sí actualiza scripts documentales, sus pruebas dedicadas y los Word derivados; conserva las fuentes originales.

## 2. Archivos actualizados

| Archivo | Cambio |
|---|---|
| [`guion-presentacion.md`](guion-presentacion.md) | Locución B4 y B5 ajustada; conteo por persona y total actualizados a 400; aclaración de que consumo/saldo no se locutan. |
| [`storyboard-video.md`](storyboard-video.md) | Conteo vigente y trazabilidad del ajuste; B4 sin locución de consumo/saldo; verificación de que C4 se lee en JSON, no en la captura del operario. |
| [`ensayo-video.md`](ensayo-video.md) | Estado y conteo actualizados a 400 palabras; B4 aclara que consumo y saldo se verifican en UI/JSON y no en la locución. |
| `cierre-video.md` | Este informe de cierre. |
| `guia-demostracion.md`, `README.md`, `../prototipo/README.md` | Preparación aislada, perfiles, datos demo y comandos compatibles con el origen de la API. |
| `evidencias-prototipo.md`, `capitulo-4-validacion.md`, `qa-final.md`, `matriz-validacion-flujos.md` | Adendas actuales sin borrar resultados históricos. |
| `../scripts/generar_documentos.py`, `../scripts/generar_entrega_prototipo.py`, `../scripts/entrega/` | Generación, saneamiento de paquetes autónomos y pruebas dedicadas. |

El presupuesto de montaje no cambió: **5 clips × 58 s = 290 s**. El objetivo editorial sigue en 285–295 s y el máximo absoluto en 300 s. Son presupuestos, no duraciones medidas.

## 3. Conteo final de locución

Método: palabras habladas dentro de cada bloque `LOC`, separadas por espacios y con al menos una letra; no se leen etiquetas, rótulos, acciones ni notas.

| Persona | Bloque | Ventana | Palabras |
|---|---|---|---:|
| Persona1 | B1 | 0:00–0:58 | 84 |
| Persona2 | B2 | 0:58–1:56 | 82 |
| Persona3 | B3 | 1:56–2:54 | 78 |
| Persona4 | B4 | 2:54–3:52 | 77 |
| Persona5 | B5 | 3:52–4:50 | 79 |
| **Total** | **B1–B5** | **290 s** | **400** |

El total de **400 palabras** queda dentro del objetivo de 380–420. La locución todavía debe leerse en voz alta y ensayarse con cronómetro; el conteo y los 58 s por clip no son una medición humana.

## 4. QA de referencia — no reejecutada en esta etapa

Las cifras siguientes provienen del reporte [`qa-final.md`](qa-final.md) y de `evidencias/qa-final/validation.json`. **No se reejecutaron** durante este ajuste documental.

| Verificación | Resultado reportado |
|---|---|
| Backend/API | **48/48 PASS** |
| Build | TypeScript y Vite correctos; **1594 módulos** |
| E2E | **50/50 PASS**: **27 casos de navegador (UI)** y **23 API-only** |
| Harness E2E | **3/3 PASS** |
| Capturas QA | **7 PNG** en `evidencias/qa-final/` |

F17 y F18 son observaciones puntuales comunicadas por coordinación, **fuera de los 50 casos**: F17 verificó la métrica «Pedidos demorados» con fixture temporal; F18 verificó catálogo, búsqueda y limpieza en Chromium headless. No son E2E persistentes y F18 no tiene captura. Se mantienen como reportes de coordinación, no como cobertura adicional de la suite.

## 5. Entregables Word y capturas

Los **4 Word** de `entregables/` fueron regenerados tras el ajuste final de locución:

- `TPO General - Validacion.docx`
- `Seccion 4 - Validacion.docx`
- `Prototipo - Evidencias.docx`
- `Guion de presentacion.docx`

El guion refleja B4/B5 finales y 400 palabras. Los otros tres Word incorporan las siete capturas QA actuales. Los paquetes autónomos eliminan encabezados/pies, customXML y medios originales no utilizados: Guion 5 entradas/0 imágenes; Evidencias y Sección 4, 12 entradas/7 imágenes cada uno. El TPO integrado conserva su contexto original: 47 entradas/23 imágenes (16 originales y 7 QA).

Comandos ejecutados y aprobados por el responsable de integración desde la raíz:

```sh
python3 -B -m unittest discover -s scripts/entrega -p 'test_*.py'
python3 -B scripts/generar_entrega_prototipo.py
git diff --check
```

Pruebas del sanitizador **3/3 PASS**. La generación valida CRC ZIP, XML, relaciones y destinos internos, texto completo, tablas y las siete imágenes contra sus fuentes. Los autónomos no contienen medios originales huérfanos ni marcadores LOC visibles. No se dispone de LibreOffice ni de un renderizador Word/PDF en este entorno, por lo que la paginación, los cortes de tabla y la apariencia final quedan como **límite de revisión visual** para el grupo.

### Originales preservados

Los originales no se modificaron. Sus hashes SHA-256 se comprobaron en lectura:

| Archivo | SHA-256 |
|---|---|
| `TPO General.docx` | `09517ee799de479a83f791fc49656d1ee43690284c4922ab264af726c8f5ff5f` |
| `TPO General - Validacion.pages` | `c44e3a504a7a0c1a431cfcd0aed8346d31b3c41da6e49d26cf9435ff261685c2` |

## 6. Pendientes y límites

- **Word final:** regenerado y validado estructuralmente; pendiente revisión visual en Word.
- **Commit:** entrega cohesiva en un commit local, después de revisar diff, estado y validación. Su referencia se comunica en el resultado de la tarea; no se realiza push.
- **Ensayos:** no hubo lectura humana cronometrada, ensayo de voz, grabación ni MP4. Los conteos y los 290 s son presupuesto editorial.
- **Historial:** el diseño y los JSON/fixtures de QA conservan su presupuesto previo de 413 palabras; no se altera la evidencia histórica para simular que midió el guion final. El vigente es 400, tal como indican el README, guion y storyboard.
- **Cifras de estado:** el consumo 576/288 g y el saldo 24/12 g siguen siendo verificables en la guía, el storyboard y el JSON; no se locutan en B4 ni se atribuyen a una pantalla que no los muestra.
