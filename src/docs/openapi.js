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
          401: error("Usuario inexistente o inactivo, o contraseña incorrecta", {
            error: "Usuario no encontrado",
            detalles: { correo: "No existe un usuario con este correo" },
          }),
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
