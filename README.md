# Calidad y pruebas de software

**Material teórico introductorio · Taller de Lenguajes de Programación IV · Unidad 4 · Octubre de 2026**

## 1. ¿Por qué probar el software?

Que una aplicación se ejecute sin mostrar errores no significa que cumpla todos los requisitos. Por ejemplo, un sistema de ventas puede calcular correctamente un descuento del 10 %, pero aceptar uno del 150 % y generar un total negativo. El programa funciona técnicamente, aunque incumple una regla de negocio.

Las pruebas permiten comparar el **comportamiento observado** con el **comportamiento esperado**. Son una forma de obtener evidencia sobre el funcionamiento del software, no una garantía absoluta de ausencia de errores.

La calidad también comprende características como mantenibilidad, confiabilidad y seguridad. Las pruebas contribuyen a la calidad, pero no la abarcan por completo.

## 2. Pruebas manuales y automatizadas

En una prueba manual, una persona realiza acciones y analiza las respuestas del sistema. En una prueba automatizada, esa verificación está expresada mediante código y puede ejecutarse repetidas veces.

| Manuales | Automatizadas |
| --- | --- |
| Útiles para explorar y descubrir situaciones nuevas. | Útiles para verificar comportamientos conocidos después de cada cambio. |
| Requieren intervención humana. | Se pueden ejecutar desde la terminal o mediante integración continua. |
| Permiten observar aspectos de experiencia de usuario. | Ofrecen resultados repetibles sobre las condiciones programadas. |

Ambas estrategias se complementan.

## 3. ¿Qué contiene un caso de prueba?

Un caso de prueba suele contener una entrada o condición, una acción y un resultado esperado. La **aserción** es la expresión que compara lo obtenido con esa expectativa.

Ejemplo:

- Entrada: precio 1.000 y descuento 10 %.
- Acción: ejecutar `calcularPrecioFinal(1000, 10)`.
- Resultado esperado: `900`.

Los casos de prueba pueden ser **habituales** (10 %), **límite** (0 % o 100 %) o **inválidos** (150 %, valores negativos, `NaN`). El resultado esperado debe surgir de los requisitos y no solamente de lo que la implementación devuelve actualmente.

## 4. Los niveles de pruebas

### Pruebas unitarias

Comprueban una unidad pequeña de comportamiento, como una función. En el laboratorio, `tests/precios.test.ts` llama directamente a `calcularPrecioFinal`, ubicada en `src/services/precios.ts`.

### Pruebas de integración

Comprueban la colaboración de varias partes. En el laboratorio, `tests/api.test.ts` usa Supertest para enviar una solicitud a Express y revisar la respuesta. Participan la ruta HTTP y el servicio de cálculo.

### Pruebas de extremo a extremo (E2E)

Comprueban un flujo completo desde la perspectiva de quien usa el sistema, por ejemplo abrir una aplicación web, iniciar sesión y confirmar una compra. No se implementarán pruebas E2E en este laboratorio.

La **pirámide de pruebas** suele representar muchas pruebas unitarias, algunas de integración y menos pruebas E2E. Es una orientación general, no una proporción obligatoria.

## 5. Introducción a Vitest

[Vitest](https://vitest.dev/guide/) es una herramienta para ejecutar pruebas automatizadas de JavaScript y TypeScript. En nuestro proyecto, las pruebas se encuentran en la carpeta `tests/` y se ejecutan con:

```bash
npm test
```

Este comando ejecuta `vitest run`, configurado en `package.json`.

Ejemplo basado en el laboratorio:

```typescript
import { describe, expect, it } from 'vitest';
import { calcularPrecioFinal } from '../src/services/precios.ts';

describe('calcularPrecioFinal', () => {
  it('aplica un descuento del 10 %', () => {
    expect(calcularPrecioFinal(1000, 10)).toBe(900);
  });
});
```

- **`describe`** agrupa pruebas relacionadas.
- **`it`** describe un comportamiento esperado.
- **`expect`** inicia una comprobación.
- **`toBe(900)`** verifica el valor recibido mediante igualdad estricta.
- **`toEqual({...})`** permite comparar estructuras como objetos y arreglos.
- **`toHaveProperty('error')`** comprueba que un objeto tenga una propiedad.

Una prueba que falla puede indicar un error de implementación, una expectativa equivocada o un requisito que todavía no está claro. El resultado debe interpretarse, no corregirse a ciegas.

## 6. Comprobar errores con `toThrow`

Algunas entradas no deberían producir un resultado normal. Por ejemplo, para un descuento de 150 %, la regla del laboratorio establece que se debe lanzar un `RangeError`.

```typescript
it('rechaza un descuento mayor al 100 %', () => {
  expect(() => calcularPrecioFinal(1000, 150)).toThrow(RangeError);
});
```

**¿Por qué aparece `() =>`?** La prueba entrega una función a Vitest. Así puede ejecutarla y verificar si lanza el error esperado. Si se escribiera directamente `expect(calcularPrecioFinal(1000, 150))`, la llamada ocurriría antes de que `toThrow` pudiera inspeccionarla.

Para rechazar entradas inválidas, la implementación puede usar:

```typescript
if (!Number.isFinite(descuento) || descuento < 0 || descuento > 100) {
  throw new RangeError('El descuento debe estar entre 0 y 100');
}
```

## 7. Probar una API de Express con Supertest

[Supertest](https://github.com/ladjs/supertest) permite enviar solicitudes HTTP a una aplicación Express durante las pruebas. No es necesario iniciar el servidor manualmente en el puerto 3000.

```typescript
import request from 'supertest';
import { app } from '../src/app.ts';

const respuesta = await request(app)
  .post('/api/precios/calcular')
  .send({ precio: 1000, descuento: 10 });

expect(respuesta.status).toBe(200);
expect(respuesta.body).toEqual({ total: 900 });
```

En este ejemplo, `200` indica una solicitud procesada correctamente. Si el cliente envía un descuento no permitido, el servicio debe lanzar un error que `src/app.ts` convierte en una respuesta `400` con un objeto JSON que contiene la propiedad `error`.

Esto es una prueba de **integración**, porque se comprueba cómo interactúan la ruta de Express y el servicio de negocio, no solamente una función aislada.

## 8. TypeScript nativo de Node.js y chequeo de tipos

Node.js 22.18 o posterior puede ejecutar directamente los archivos `.ts` que utilicen sintaxis compatible con su eliminación de tipos. Este proyecto no necesita `ts-node` ni `tsx` para arrancar:

```bash
npm run dev
```

Sin embargo, **ejecutar TypeScript no equivale a comprobar tipos**. Por eso el proyecto incorpora:

```bash
npm run typecheck
```

Este comando utiliza `tsc --noEmit`: analiza los tipos sin generar archivos JavaScript. Las pruebas automatizadas comprueban comportamientos; el análisis de tipos identifica otra clase de problemas. Conviene utilizar ambas verificaciones.

## 9. TDD y cobertura de código

El **desarrollo guiado por pruebas** (TDD) propone escribir primero una prueba que falla, implementar el cambio necesario para que pase y después mejorar el código manteniendo las pruebas exitosas. Suele resumirse como **rojo → verde → refactorización**.

La **cobertura de código** señala qué partes se ejecutaron durante las pruebas. Una cobertura alta no garantiza que se hayan comprobado todos los comportamientos importantes.

## 10. Dobles de prueba

Cuando una función depende de servicios externos, pueden utilizarse dobles de prueba:

- **Stub:** proporciona una respuesta controlada.
- **Mock:** puede simular una dependencia y permitir comprobar interacciones.
- **Spy (espía):** registra llamadas para inspeccionar cómo se utilizó una función.

En este primer laboratorio no es necesario implementarlos; alcanza con conocer su propósito.

## 11. Integración continua (CI)

La **integración continua** consiste en integrar cambios con frecuencia y automatizar verificaciones para detectar fallas tempranamente. El proyecto ya incluye el archivo `.github/workflows/pruebas.yml`, que define un flujo de GitHub Actions para:

1. Obtener el código del repositorio.
2. Preparar Node.js.
3. Instalar dependencias con `npm ci`.
4. Ejecutar `npm run typecheck`.
5. Ejecutar `npm test`.

El archivo `package-lock.json`, generado con `npm install`, debe incluirse en el repositorio para que `npm ci` pueda funcionar. La CI no sustituye el juicio profesional ni garantiza que el sistema esté libre de defectos.

## 12. Síntesis y preguntas de repaso

Las pruebas ayudan a verificar requisitos y detectar regresiones, es decir, fallas introducidas al modificar un comportamiento que antes funcionaba. En este laboratorio se empieza con una función aislada y se continúa con una ruta HTTP, utilizando herramientas que responden a necesidades distintas.

1. ¿Por qué una API que devuelve una respuesta HTTP 200 puede contener errores de negocio?
2. ¿Qué diferencia hay entre una prueba unitaria y una de integración?
3. ¿Por qué `toThrow` recibe una función en lugar del resultado de ejecutarla?
4. ¿Qué diferencia existe entre `npm test` y `npm run typecheck`?
5. ¿Qué aporta GitHub Actions al trabajo colaborativo?

## Fuentes para ampliar

- [Vitest: guía oficial](https://vitest.dev/guide/)
- [Node.js: TypeScript](https://nodejs.org/api/typescript.html)
- [Supertest](https://github.com/ladjs/supertest)
- [GitHub Actions](https://docs.github.com/actions)
