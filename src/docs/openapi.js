// Especificación OpenAPI 3 de la API, servida con Swagger UI en /api-docs.
// Al agregar o cambiar un endpoint, actualizar también este archivo.
const config = require("../config/env");

const error = (descripcion, ejemplo) => ({
  description: descripcion,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
      example: ejemplo,
    },
  },
});

const respuestas = {
  400: error("Datos inválidos", {
    error: "Revisa los datos",
    detalles: { correo: "Correo inválido (solo @duoc.cl, @profesor.duoc.cl o @gmail.com)" },
  }),
  401: error("Sin token, token inválido o vencido, o cuenta inactiva", {
    error: "Debes iniciar sesión",
  }),
  403: error("El rol no tiene permiso", { error: "No tienes permiso para esta acción" }),
  404: error("Usuario no encontrado", { error: "Usuario no encontrado" }),
  409: error("Conflicto con el estado actual", { error: "El correo o RUN ya está registrado" }),
};

const parametroId = {
  name: "id",
  in: "path",
  required: true,
  description: "Id numérico del usuario",
  schema: { type: "integer", minimum: 1 },
  example: 1,
};

const json = (schema, example) => ({
  required: true,
  content: { "application/json": { schema, ...(example && { example }) } },
});

const ok = (descripcion, schema) => ({
  description: descripcion,
  content: { "application/json": { schema } },
});

const ref = (nombre) => ({ $ref: `#/components/schemas/${nombre}` });

const ejemploUsuario = {
  nombre: "Camila",
  apellido: "Rojas",
  fechaNacimiento: "1998-04-12",
  correo: "camila.rojas@gmail.com",
  region: "Región de Valparaíso",
  comuna: "Concón",
  direccion: "Av. Borgoño 123",
};

const parametroIdProducto = {
  ...parametroId,
  description: "Id numérico del producto",
};

const ejemploProducto = {
  codigo: "MI005",
  nombre: "Micrófono Inalámbrico de Mano",
  marca: "Shure",
  modelo: "BLX24/SM58",
  descripcion: "Sistema inalámbrico con cápsula SM58.",
  categoria: "Micrófonos",
  precio: 399990,
  stock: 4,
  imagen: null,
};

const errorProducto400 = error("Datos inválidos o categoría inexistente", {
  error: "Revisa los datos del producto",
  detalles: { precio: "El precio debe ser un entero entre 0 y 100000000" },
});
const errorProducto404 = error("Producto no encontrado o desactivado", {
  error: "Producto no encontrado",
});
const errorProducto409 = error("Código repetido", {
  error: "Ya existe un producto con ese código",
  detalles: { codigo: "Código repetido" },
});

const parametroIdPedido = {
  ...parametroId,
  description: "Id numérico del pedido",
  schema: { type: "integer", minimum: 1, maximum: 2147483647 },
};
const errorPedido400 = error("Id o datos del pedido inválidos", {
  error: "El máximo es de cinco unidades por producto",
  detalles: { codigo: "GA001" },
});
const errorPedido404 = error("Pedido fuera del alcance del usuario, inexistente o producto no disponible", {
  error: "Pedido no encontrado",
});
const errorPedido409 = error("Stock insuficiente o pago simulado rechazado", {
  error: "Stock insuficiente",
  detalles: { codigo: "GA001" },
});

const dinero = { type: "integer", minimum: 0, description: "Monto en pesos chilenos" };
const contactoPedido = {
  type: "object",
  required: ["nombre", "apellido", "correo"],
  properties: {
    nombre: { type: "string", minLength: 1, maxLength: 50 },
    apellido: { type: "string", minLength: 1, maxLength: 100 },
    correo: { type: "string", format: "email", maxLength: 100 },
  },
};
const entregaPedido = {
  type: "object",
  required: ["tipo"],
  properties: {
    tipo: { type: "string", enum: ["retiro", "despacho"] },
    region: { type: "string", maxLength: 100 },
    comuna: { type: "string", maxLength: 100 },
    direccion: { type: "string", maxLength: 300 },
  },
  description: "Región, comuna y dirección son obligatorias cuando el tipo es despacho.",
};

module.exports = {
  openapi: "3.0.3",
  info: {
    title: "Sonido Vivo API",
    version: "1.0.0",
    description:
      "API REST de Sonido Vivo. Para probar las rutas protegidas: inicia sesión en " +
      "`POST /api/v1/auth/login`, copia el `accessToken` y pégalo en **Authorize**.",
  },
  servers: [{ url: config.urlApi, description: "Servidor actual" }],
  tags: [
    { name: "Autenticación", description: "Inicio de sesión y registro" },
    { name: "Usuarios", description: "CRUD de usuarios (solo Administrador)" },
    {
      name: "Productos",
      description:
        "Catálogo de instrumentos, equipos y accesorios. Leer es público; " +
        "Administrador y Vendedor crean y editan; solo el Administrador elimina.",
    },
    {
      name: "Pedidos",
      description: "Compra como invitado o con sesión, consulta del historial y gestión de estados.",
    },
    {
      name: "KaijuApp",
      description:
        "Usuarios de KaijuApp (DSY1105). Usa un token de `POST /api/v1/kaiju/auth/login`: " +
        "los tokens de Sonido Vivo no sirven aquí y los de Kaiju no sirven en Sonido Vivo.",
    },
  ],
  paths: {
    "/api/v1/auth/login": {
      post: {
        tags: ["Autenticación"],
        summary: "Inicia sesión y devuelve un JWT",
        requestBody: json(ref("LoginRequest"), {
          correo: "admin@duoc.cl",
          contrasena: "1234",
        }),
        responses: {
          200: ok("Sesión iniciada", ref("LoginResponse")),
          400: error("Falta el correo o la contraseña", {
            error: "Ingresa correo y contraseña",
          }),
          401: error("Credenciales incorrectas o cuenta inactiva", {
            error: "Correo o contraseña incorrectos",
          }),
        },
      },
    },
    "/api/v1/auth/registro": {
      post: {
        tags: ["Autenticación"],
        summary: "Registra un usuario con rol Cliente",
        requestBody: json(ref("RegistroRequest"), {
          rut: "123456785",
          ...ejemploUsuario,
          contrasena: "clave1",
        }),
        responses: {
          201: ok("Usuario registrado", ref("RegistroResponse")),
          400: respuestas[400],
          409: respuestas[409],
        },
      },
    },
    "/api/v1/usuarios": {
      get: {
        tags: ["Usuarios"],
        summary: "Lista todos los usuarios",
        security: [{ bearerAuth: [] }],
        responses: {
          200: ok("Listado de usuarios", { type: "array", items: ref("Usuario") }),
          401: respuestas[401],
          403: respuestas[403],
        },
      },
      post: {
        tags: ["Usuarios"],
        summary: "Crea un usuario con el rol indicado",
        security: [{ bearerAuth: [] }],
        requestBody: json(ref("UsuarioCrear"), {
          rut: "123456785",
          ...ejemploUsuario,
          contrasena: "clave1",
          rol: "Vendedor",
        }),
        responses: {
          201: ok("Usuario creado", ref("RegistroResponse")),
          400: respuestas[400],
          401: respuestas[401],
          403: respuestas[403],
          409: respuestas[409],
        },
      },
    },
    "/api/v1/usuarios/{id}": {
      parameters: [parametroId],
      get: {
        tags: ["Usuarios"],
        summary: "Obtiene un usuario por su id",
        security: [{ bearerAuth: [] }],
        responses: {
          200: ok("Usuario encontrado", ref("Usuario")),
          400: error("Id inválido", { error: "Id inválido" }),
          401: respuestas[401],
          403: respuestas[403],
          404: respuestas[404],
        },
      },
      put: {
        tags: ["Usuarios"],
        summary: "Modifica los datos y el rol de un usuario",
        description:
          "Se envían todos los campos. El RUN y la contraseña no se modifican. " +
          "Un administrador no puede cambiar su propio rol (409).",
        security: [{ bearerAuth: [] }],
        requestBody: json(ref("UsuarioActualizar"), { ...ejemploUsuario, rol: "Cliente" }),
        responses: {
          200: ok("Usuario actualizado", ref("Usuario")),
          400: respuestas[400],
          401: respuestas[401],
          403: respuestas[403],
          404: respuestas[404],
          409: error("Correo duplicado o intento de cambiar el propio rol", {
            error: "No puedes cambiar tu propio rol",
          }),
        },
      },
      delete: {
        tags: ["Usuarios"],
        summary: "Desactiva un usuario (eliminación lógica)",
        description:
          "Marca al usuario como inactivo; pierde el acceso de inmediato. " +
          "Un administrador no puede desactivar su propia cuenta (409).",
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: "Usuario desactivado" },
          400: error("Id inválido", { error: "Id inválido" }),
          401: respuestas[401],
          403: respuestas[403],
          404: respuestas[404],
          409: error("Intento de desactivar la propia cuenta", {
            error: "No puedes desactivar tu propia cuenta",
          }),
        },
      },
    },
    "/api/v1/productos": {
      get: {
        tags: ["Productos"],
        summary: "Lista los productos activos del catálogo",
        responses: {
          200: ok("Listado de productos", { type: "array", items: ref("Producto") }),
        },
      },
      post: {
        tags: ["Productos"],
        summary: "Agrega un producto al catálogo",
        security: [{ bearerAuth: [] }],
        requestBody: json(ref("ProductoEntrada"), ejemploProducto),
        responses: {
          201: ok("Producto creado", ref("Producto")),
          400: errorProducto400,
          401: respuestas[401],
          403: respuestas[403],
          409: errorProducto409,
        },
      },
    },
    "/api/v1/productos/{id}": {
      parameters: [parametroIdProducto],
      get: {
        tags: ["Productos"],
        summary: "Obtiene un producto por su id",
        responses: {
          200: ok("Producto encontrado", ref("Producto")),
          400: error("Id inválido", { error: "Id inválido" }),
          404: errorProducto404,
        },
      },
      put: {
        tags: ["Productos"],
        summary: "Modifica un producto (se envían todos los campos)",
        description:
          "Exige `actualizadoEn` tal como vino en el GET. Si otra edición o una venta " +
          "modificó el producto desde entonces, responde 409 y hay que recargarlo.",
        security: [{ bearerAuth: [] }],
        requestBody: json(ref("ProductoEntrada"), {
          ...ejemploProducto,
          stock: 6,
          actualizadoEn: "2026-11-25T14:03:12.345Z",
        }),
        responses: {
          200: ok("Producto actualizado", ref("Producto")),
          400: errorProducto400,
          401: respuestas[401],
          403: respuestas[403],
          404: errorProducto404,
          409: error("Código repetido o el producto cambió desde que se leyó", {
            error: "El producto fue modificado por otra operación, recarga e intenta de nuevo",
            detalles: { actualizadoEn: "Versión desactualizada" },
          }),
        },
      },
      delete: {
        tags: ["Productos"],
        summary: "Saca un producto del catálogo (eliminación lógica)",
        description:
          "Marca el producto como inactivo. No se borra la fila porque los pedidos " +
          "antiguos siguen apuntando a él. Solo Administrador.",
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: "Producto desactivado" },
          400: error("Id inválido", { error: "Id inválido" }),
          401: respuestas[401],
          403: respuestas[403],
          404: errorProducto404,
        },
      },
    },
    "/api/v1/pedidos": {
      post: {
        tags: ["Pedidos"],
        summary: "Crea un pedido y devuelve el comprobante",
        description:
          "Sin encabezado Authorization crea un pedido de invitado. Si se envía un token, " +
          "debe ser válido y el usuario se toma de la sesión. Máximo cinco unidades por código, " +
          "incluidas líneas repetidas. Se aplican precios y stock del catálogo y $6.767 CLP " +
          "por despacho. El retiro es gratuito. El pago es simulado.",
        security: [{ bearerAuth: [] }, {}],
        requestBody: json(ref("PedidoEntrada"), {
          items: [{ codigo: "GA001", cantidad: 2 }],
          cliente: { nombre: "Camila", apellido: "Rojas", correo: "camila@example.com" },
          entrega: { tipo: "retiro" },
          pagoSimulado: "aprobado",
        }),
        responses: {
          201: ok("Pedido creado en estado En preparación", ref("Pedido")),
          400: errorPedido400,
          401: respuestas[401],
          404: error("Producto inexistente o inactivo", { error: "Producto no disponible" }),
          409: errorPedido409,
        },
      },
      get: {
        tags: ["Pedidos"],
        summary: "Lista pedidos del más reciente al más antiguo",
        description: "Cliente ve sus pedidos. Administrador y Vendedor ven todos, incluidos los de invitados.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: ok("Listado de pedidos", { type: "array", items: ref("Pedido") }),
          401: respuestas[401],
          403: respuestas[403],
        },
      },
    },
    "/api/v1/pedidos/{id}": {
      parameters: [parametroIdPedido],
      get: {
        tags: ["Pedidos"],
        summary: "Consulta el detalle de un pedido",
        description: "Cliente solo puede consultar pedidos propios. Administrador y Vendedor pueden consultar cualquier pedido.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: ok("Detalle del pedido", ref("Pedido")),
          400: error("Id inválido", { error: "Id inválido" }),
          401: respuestas[401],
          403: respuestas[403],
          404: errorPedido404,
        },
      },
      put: {
        tags: ["Pedidos"],
        summary: "Avanza el estado del pedido",
        description:
          "Administrador o Vendedor. Para un despacho, el pedido pasa de En preparación a Despachado " +
          "y luego a Entregado. Para un retiro, pasa directamente de En preparación a Entregado. " +
          "Los pedidos Cancelados y Entregados son terminales.",
        security: [{ bearerAuth: [] }],
        requestBody: json(
          {
            type: "object",
            required: ["estado"],
            properties: { estado: { type: "string", enum: ["Despachado", "Entregado"] } },
          },
          { estado: "Despachado" },
        ),
        responses: {
          200: ok("Estado actualizado", ref("Pedido")),
          400: error("Id o estado inválido", { error: "El estado debe ser Despachado o Entregado" }),
          401: respuestas[401],
          403: respuestas[403],
          404: errorPedido404,
          409: error("Transición no permitida", { error: "El pedido no puede pasar a ese estado" }),
        },
      },
      delete: {
        tags: ["Pedidos"],
        summary: "Cancela lógicamente un pedido En preparación",
        description:
          "Solo Administrador. Conserva el pedido y sus ítems y repone en una sola transacción " +
          "las unidades descontadas al crearlo. Una segunda cancelación devuelve 409 y el stock se repone una sola vez. " +
          "Los pedidos Despachados, Entregados y cualquier otro estado distinto de En preparación devuelven 409.",
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: "Pedido cancelado" },
          400: error("Id inválido", { error: "Id inválido" }),
          401: respuestas[401],
          403: respuestas[403],
          404: errorPedido404,
          409: error("El pedido no está En preparación", {
            error: "Solo se pueden cancelar pedidos En preparación",
          }),
        },
      },
    },
    "/api/v1/kaiju/auth/login": {
      post: {
        tags: ["KaijuApp"],
        summary: "Inicia sesión en KaijuApp y devuelve un JWT de Kaiju",
        description: "Los errores vienen por campo en `detalles` (correo o contrasena).",
        requestBody: json(ref("LoginRequest"), {
          correo: "admin.kaiju@duoc.cl",
          contrasena: "1234",
        }),
        responses: {
          200: ok("Sesión iniciada", ref("KaijuLoginResponse")),
          400: error("Correo mal formado o contraseña vacía", {
            error: "Revisa los datos",
            detalles: { correo: "Ingresa un correo válido" },
          }),
          401: error(
            "Usuario inexistente o inactivo, o contraseña incorrecta. La respuesta es " +
              "idéntica en los tres casos para no revelar qué correos tienen cuenta.",
            {
              error: "Correo o contraseña incorrectos",
              detalles: {
                correo: "Correo o contraseña incorrectos",
                contrasena: "Correo o contraseña incorrectos",
              },
            },
          ),
        },
      },
    },
    "/api/v1/kaiju/usuarios": {
      get: {
        tags: ["KaijuApp"],
        summary: "Lista los usuarios activos de KaijuApp",
        security: [{ bearerAuth: [] }],
        responses: {
          200: ok("Listado de usuarios", { type: "array", items: ref("KaijuUsuario") }),
          401: respuestas[401],
          403: respuestas[403],
        },
      },
      post: {
        tags: ["KaijuApp"],
        summary: "Crea un usuario de KaijuApp",
        security: [{ bearerAuth: [] }],
        requestBody: json(ref("KaijuUsuarioCrear"), {
          nombre: "Vendedor Nuevo",
          correo: "nuevo.kaiju@duoc.cl",
          contrasena: "1234",
          rol: "Vendedor",
        }),
        responses: {
          201: ok("Usuario creado", ref("KaijuUsuario")),
          400: error("Datos inválidos", {
            error: "Revisa los datos",
            detalles: { rol: "Rol inválido" },
          }),
          401: respuestas[401],
          403: respuestas[403],
          409: error("Correo repetido", {
            error: "El correo ya está registrado",
            detalles: { correo: "El correo ya está registrado" },
          }),
        },
      },
    },
    "/api/v1/kaiju/usuarios/{id}": {
      parameters: [parametroId],
      get: {
        tags: ["KaijuApp"],
        summary: "Obtiene un usuario de KaijuApp por su id",
        security: [{ bearerAuth: [] }],
        responses: {
          200: ok("Usuario encontrado", ref("KaijuUsuario")),
          400: error("Id inválido", { error: "Id inválido" }),
          401: respuestas[401],
          403: respuestas[403],
          404: respuestas[404],
        },
      },
      put: {
        tags: ["KaijuApp"],
        summary: "Modifica un usuario de KaijuApp",
        description:
          "La contraseña es opcional: si viene se cambia, si no viene se mantiene. " +
          "Un administrador no puede cambiar su propio rol (409).",
        security: [{ bearerAuth: [] }],
        requestBody: json(ref("KaijuUsuarioActualizar"), {
          nombre: "Ignacia Diaz",
          correo: "vendedor.kaiju@duoc.cl",
          rol: "Encargado de inventario",
        }),
        responses: {
          200: ok("Usuario actualizado", ref("KaijuUsuario")),
          400: respuestas[400],
          401: respuestas[401],
          403: respuestas[403],
          404: respuestas[404],
          409: error("Correo repetido o intento de cambiar el propio rol", {
            error: "No puedes cambiar tu propio rol",
          }),
        },
      },
      delete: {
        tags: ["KaijuApp"],
        summary: "Desactiva un usuario de KaijuApp (eliminación lógica)",
        description: "Un administrador no puede desactivar su propia cuenta (409).",
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: "Usuario desactivado" },
          400: error("Id inválido", { error: "Id inválido" }),
          401: respuestas[401],
          403: respuestas[403],
          404: respuestas[404],
          409: error("Intento de desactivar la propia cuenta", {
            error: "No puedes desactivar tu propia cuenta",
          }),
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Rol: { type: "string", enum: ["Administrador", "Vendedor", "Cliente"] },
      ProductoEntrada: {
        type: "object",
        required: ["codigo", "nombre", "marca", "modelo", "categoria", "precio", "stock"],
        properties: {
          codigo: {
            type: "string",
            pattern: "^[A-Z0-9-]{2,10}$",
            description: "Código del catálogo, único (se guarda en mayúsculas)",
          },
          nombre: { type: "string", maxLength: 100 },
          marca: { type: "string", maxLength: 50 },
          modelo: { type: "string", maxLength: 50 },
          descripcion: { type: "string", maxLength: 500, nullable: true },
          categoria: {
            type: "string",
            description: "Nombre de una categoría existente, por ejemplo Micrófonos",
          },
          precio: { type: "integer", minimum: 0, maximum: 100000000, description: "Pesos chilenos" },
          stock: { type: "integer", minimum: 0, maximum: 1000000 },
          imagen: { type: "string", maxLength: 500, nullable: true, description: "Ruta o URL" },
          precioPromocional: {
            type: "integer",
            minimum: 0,
            nullable: true,
            description: "Precio de oferta en CLP; debe ser menor que precio. null = sin promoción",
          },
          actualizadoEn: {
            type: "string",
            format: "date-time",
            description:
              "Solo en PUT y obligatorio: el actualizadoEn recibido al leer el producto. " +
              "Si el producto cambió desde entonces (otra edición o una venta) responde 409.",
          },
        },
      },
      Producto: {
        type: "object",
        properties: {
          id: { type: "integer" },
          codigo: { type: "string" },
          nombre: { type: "string" },
          marca: { type: "string" },
          modelo: { type: "string" },
          descripcion: { type: "string", nullable: true },
          categoria: { type: "string" },
          precio: { type: "integer" },
          precioPromocional: { type: "integer", nullable: true },
          precioFinal: {
            type: "integer",
            description: "Precio que se cobra: la promoción si existe y es menor, si no el precio",
          },
          stock: { type: "integer" },
          imagen: { type: "string", nullable: true },
          actualizadoEn: {
            type: "string",
            format: "date-time",
            description: "Versión del producto; se devuelve tal cual en el PUT",
          },
        },
      },
      ContactoPedido: contactoPedido,
      EntregaPedido: entregaPedido,
      PedidoEntrada: {
        type: "object",
        required: ["items", "cliente", "entrega"],
        properties: {
          items: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["codigo", "cantidad"],
              properties: {
                codigo: { type: "string", pattern: "^[A-Z0-9-]{2,10}$" },
                cantidad: { type: "integer", minimum: 1, maximum: 5 },
              },
            },
          },
          cliente: ref("ContactoPedido"),
          entrega: ref("EntregaPedido"),
          pagoSimulado: { type: "string", enum: ["aprobado", "rechazado"], default: "aprobado" },
        },
      },
      Pedido: {
        type: "object",
        properties: {
          id: { type: "integer" },
          usuarioId: { type: "integer", nullable: true },
          fecha: { type: "string", format: "date-time" },
          estado: {
            type: "string",
            enum: ["En preparación", "Confirmado", "Despachado", "Entregado", "Cancelado"],
          },
          cliente: { ...contactoPedido, nullable: true },
          entrega: { ...entregaPedido, nullable: true },
          subtotal: { ...dinero, nullable: true },
          despacho: { ...dinero, nullable: true },
          total: dinero,
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", description: "Código de catálogo al comprar" },
                productoId: { type: "integer" },
                nombre: { type: "string" },
                precio: dinero,
                cantidad: { type: "integer", minimum: 1 },
              },
            },
          },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          detalles: {
            type: "object",
            additionalProperties: { type: "string" },
            description: "Errores por campo, cuando corresponde",
          },
        },
        required: ["error"],
      },
      LoginRequest: {
        type: "object",
        required: ["correo", "contrasena"],
        properties: {
          correo: { type: "string", format: "email" },
          contrasena: { type: "string" },
        },
      },
      UsuarioResumen: {
        type: "object",
        properties: {
          id: { type: "integer" },
          nombre: { type: "string" },
          apellido: { type: "string" },
          correo: { type: "string" },
          rol: ref("Rol"),
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          tokenType: { type: "string", example: "Bearer" },
          expiresIn: { type: "string", example: "1h" },
          usuario: ref("UsuarioResumen"),
        },
      },
      DatosUsuario: {
        type: "object",
        required: ["nombre", "apellido", "correo", "region", "comuna", "direccion"],
        properties: {
          nombre: { type: "string", maxLength: 50 },
          apellido: { type: "string", maxLength: 100 },
          fechaNacimiento: { type: "string", format: "date", nullable: true },
          correo: {
            type: "string",
            maxLength: 100,
            description: "Solo @duoc.cl, @profesor.duoc.cl o @gmail.com",
          },
          region: { type: "string", maxLength: 100 },
          comuna: { type: "string", maxLength: 100 },
          direccion: { type: "string", maxLength: 300 },
        },
      },
      RegistroRequest: {
        allOf: [
          ref("DatosUsuario"),
          {
            type: "object",
            required: ["rut", "contrasena"],
            properties: {
              rut: {
                type: "string",
                description: "RUN sin puntos ni guion, con dígito verificador",
                example: "123456785",
              },
              contrasena: { type: "string", minLength: 4, maxLength: 10 },
            },
          },
        ],
      },
      UsuarioCrear: {
        allOf: [
          ref("RegistroRequest"),
          { type: "object", required: ["rol"], properties: { rol: ref("Rol") } },
        ],
      },
      UsuarioActualizar: {
        allOf: [
          ref("DatosUsuario"),
          { type: "object", required: ["rol"], properties: { rol: ref("Rol") } },
        ],
      },
      RegistroResponse: {
        type: "object",
        properties: {
          mensaje: { type: "string" },
          usuario: ref("UsuarioResumen"),
        },
      },
      Usuario: {
        type: "object",
        properties: {
          id: { type: "integer" },
          rut: { type: "string" },
          nombre: { type: "string" },
          apellido: { type: "string" },
          fecha_nacimiento: { type: "string", format: "date", nullable: true },
          correo: { type: "string" },
          region: { type: "string" },
          comuna: { type: "string" },
          direccion: { type: "string" },
          activo: { type: "boolean" },
          creado_en: { type: "string", format: "date-time" },
          rol: ref("Rol"),
        },
      },
      KaijuRol: {
        type: "string",
        enum: ["Administrador", "Encargado de inventario", "Vendedor"],
      },
      KaijuUsuario: {
        type: "object",
        properties: {
          id: { type: "integer" },
          nombre: { type: "string" },
          correo: { type: "string" },
          rol: ref("KaijuRol"),
          activo: { type: "boolean" },
          creado_en: { type: "string", format: "date-time" },
        },
      },
      KaijuUsuarioActualizar: {
        type: "object",
        required: ["nombre", "correo", "rol"],
        properties: {
          nombre: { type: "string", maxLength: 100 },
          correo: { type: "string", format: "email", maxLength: 100 },
          contrasena: {
            type: "string",
            minLength: 4,
            maxLength: 10,
            description: "Opcional en PUT; si no viene, no se cambia",
          },
          rol: ref("KaijuRol"),
        },
      },
      KaijuUsuarioCrear: {
        allOf: [ref("KaijuUsuarioActualizar"), { type: "object", required: ["contrasena"] }],
      },
      KaijuLoginResponse: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          tokenType: { type: "string", example: "Bearer" },
          expiresIn: { type: "string", example: "1h" },
          usuario: {
            type: "object",
            properties: {
              id: { type: "integer" },
              nombre: { type: "string" },
              correo: { type: "string" },
              rol: ref("KaijuRol"),
            },
          },
        },
      },
    },
  },
};
