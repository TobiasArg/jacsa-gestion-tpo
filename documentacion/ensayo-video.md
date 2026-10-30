# Ensayo de locución y preparación del video — JACSA Gestión

**Estado:** los seis MP4 **mudos** del [plan de producción 5 × 60 s](plan-produccion-video-60s.md) ya están entregados en [`entregables/videos/`](../entregables/videos/): cinco clips de **60,000 s** y un continuo de **300,000 s**, H.264 1920 × 1080 a 30 fps, sin pista de audio, grabados como pantalla continua sobre la UI de `9d5b831` (verificación en el [cierre](cierre-video.md)). Este documento es el plan de ensayo y de locución: no es constancia de que el grupo haya ensayado, grabado voz humana ni revisado los clips completos a velocidad normal. Ningún video incorpora voz ni música: la locución la hacen las cinco personas, **en vivo** o **grabada**, siguiendo el [guion](guion-presentacion.md) (401 palabras) y los cues del [storyboard](storyboard-video.md).

## 1. Cómo se obtienen los clips

La captura no se hace a mano ni sobre la demo habitual. Sigue el [plan de producción](plan-produccion-video-60s.md) (§3 y §7) y la ejecuta `prototipo/scripts/video/record-demo-video.mjs` (comandos en el [cierre](cierre-video.md) §0.4):

1. Se usa el build estático `browser-demo` de `9d5b831`, servido por el servidor estático propio del script en `127.0.0.1` con puerto efímero (el plan proponía `vite preview` en 4291). No se usan 3001, 3002, 4190 ni 5173, y no se detiene ningún proceso ajeno.
2. Un contexto **nuevo** de Playwright, sin `storageState`, arranca con almacenamiento vacío: el seed C0 se recrea solo. **No hay reset**, no se tocan bases SQLite y toda request a `/api/` se aborta.
3. Hay una pestaña por rol (`cliente`, `rodrigo`, `lorena`, `operario`) con login fuera de cámara. Las cinco tomas salen de una sola corrida, en orden C0 → C4.
4. El montaje produce `jacsa-60s-1…5-*.mp4` (1800 frames cada uno) y `jacsa-300s-continuo.mp4` (9000 frames), todos sin pista de audio.

La captura, el montaje y los controles de calidad ya se ejecutaron con el ffmpeg b6.1.1 verificado y autorizado por la coordinación, invocado por ruta absoluta sin instalarlo globalmente ni modificar `PATH`. Los seis archivos entregados son:

| Archivo | Clip | Duración |
|---|---|---:|
| `jacsa-60s-1-cliente-solicitud.mp4` | B1 · C0 → C1 | 60,000 s |
| `jacsa-60s-2-comercial-pedido.mp4` | B2 · C1 → C2 | 60,000 s |
| `jacsa-60s-3-abastecimiento-plan.mp4` | B3 · C2 → C3 | 60,000 s |
| `jacsa-60s-4-operario-produccion.mp4` | B4 · C3 → C4 | 60,000 s |
| `jacsa-60s-5-cliente-seguimiento.mp4` | B5 · C4 → C4 | 60,000 s |
| `jacsa-300s-continuo.mp4` | B1–B5 unidos | 300,000 s |

Todos son H.264 1920 × 1080 a 30 fps, sin pista de audio, voz ni música. Una nueva regrabación solo hace falta si se cambia la UI o el storyboard. No ejecutar `tests/e2e/rehearsal.spec.ts`, que sobrescribe la evidencia histórica.

## 2. Secuencia C0–C4 que deben mostrar los clips

| Clip | Entrada → salida | Qué tiene que quedar comprobado al final |
|---|---|---|
| B1 · 60 s | C0 → C1 | Solicitud Nueva de ART-001, 2 gruesas (288); vista previa 21.600 / 4.536 / 26.136 ARS; mensaje «No se notificó al equipo comercial.» |
| B2 · 60 s | C1 → C2 | Pedido Pendiente; reservas 400/200 g y faltantes 176/88 g. |
| B3 · 60 s | C2 → C3 | Ingresos 200/100 g; faltantes en cero; reserva completa; M-04, prioridad 1. |
| B4 · 60 s | C3 → C4 | Pedido Listo, 288/288, control registrado; consumo 576/288 g visible; saldo 24/12 g (no se locuta). |
| B5 · 60 s | C4 → C4 | Portal con pedido Listo, Calidad verificada y avisos Registrada; tarjeta de cierre. |
| **Total** | **300 s** | Cada clip entra en un checkpoint y sale en el siguiente. |

Si un checkpoint no coincide, la captura se aborta y se repite **la corrida completa** en un directorio de trabajo nuevo; no se mezclan clips de corridas distintas.

## 3. Ensayo de voz sobre los clips mudos

Reparto fijo, una persona por clip:

| Clip | Persona | Ventana de voz | Palabras | Voz estimada |
|---|---|---|---:|---:|
| B1 | Persona1 | 3,5–57,5 s | 86 | 34–40 s |
| B2 | Persona2 | 3,5–57,5 s | 82 | 33–38 s |
| B3 | Persona3 | 3,5–57,5 s | 78 | 31–36 s |
| B4 | Persona4 | 3,5–57,5 s | 77 | 31–36 s |
| B5 | Persona5 | 3,5–54 s | 78 | 31–36 s |
| **Total** | **5 personas** | **5 × 60 s = 300 s** | **401** | **160–185 s** |

1. **Lectura en frío:** cada persona lee su bloque en voz alta con cronómetro, sin video. Anotar el tiempo real; si supera la ventana de su clip, ajustar pausas antes que palabras.
2. **Lectura sobre el clip:** reproducir el MP4 mudo **sin acelerar** y leer siguiendo la columna «Cue de voz» del storyboard. La frase de cada cifra se dice mientras la cifra está quieta en pantalla.
3. **Pasada continua:** las cinco personas, en orden, sobre `jacsa-300s-continuo.mp4`. Cada voz empieza después del rótulo de su clip (3,5 s) y termina antes del fundido; el relevo ocurre durante el negro y el rótulo siguiente.
4. Registrar en una tabla propia los tiempos medidos por persona. Recién entonces se puede decir que hubo ensayo.

## 4. Locución en vivo o grabada

- **En vivo:** se proyecta el continuo o cada clip por separado y cada persona habla en su tramo. Nadie pausa ni acelera el video; si alguien se atrasa, recorta la última frase de su bloque y no invade el clip siguiente.
- **Grabada:** cada persona graba su bloque como un archivo de voz propio, mirando su clip. Los MP4 entregados siguen mudos: la voz no se mezcla en ellos ni se agrega música.
- En ambos casos, la voz es humana y la dicen Persona1–Persona5. No se usan voces sintéticas.
- La locución no agrega datos que no estén en pantalla, no afirma que la solicitud llegó al equipo comercial ni que un aviso se envió por correo o mensaje.

## 5. Lista del equipo antes de presentar

- [x] Los seis MP4 existen, pasaron los controles automáticos del plan (§9) y no tienen pista de audio.
- [x] B1–B5 duran 60,000 s cada uno y el continuo dura 300,000 s.
- [ ] El grupo reprodujo los seis archivos completos a velocidad normal y confirmó lo que se ve.
- [ ] B1 muestra **Registrar solicitud**, «Autorizo el registro de estos datos para la solicitud.» y «No se notificó al equipo comercial.».
- [ ] La tarjeta final de B5 dice «JACSA Gestión · Prototipo funcional» y «Los avisos quedan registrados; no se envían correos ni mensajes.».
- [ ] Ningún rótulo, tarjeta ni locución contiene IDs, fechas fijas ni textos ajenos al prototipo.
- [ ] Persona1–Persona5 leyeron su bloque en voz alta y lo ensayaron con cronómetro sobre su clip.
- [ ] Si la locución es grabada, hay un archivo de voz por persona y los MP4 siguen mudos.
- [ ] Pasada continua de 300 s completa, sin invadir el clip siguiente.

## 6. Evidencia y pendientes

La QA final y la QA del build `browser-demo` comprobaron el flujo con pruebas automatizadas; sus tiempos y capturas no son tiempos de video ni prueban que una persona leyó el guion. La captura, el montaje y los controles automáticos de los clips mudos están hechos (ver [cierre](cierre-video.md) §0). Pendiente: la revisión completa de los seis MP4 a velocidad normal por el grupo, ensayar las cinco voces sobre los clips mudos y, si se elige, grabar cada locución.
