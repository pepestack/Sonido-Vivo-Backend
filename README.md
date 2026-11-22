<p align="center"><img src="https://raw.githubusercontent.com/pepestack/Sonido-Vivo/main/src/assets/images/logo-v1.webp" alt="Sonido Vivo Logo" width=150></p>
<h1 align="center">Sonido Vivo – Backend</h1>
 
<p align="center">
  <img src="https://img.shields.io/badge/Curso-DSY1104%20Desarrollo%20FullStack%20II-blue" alt="Curso">
  <img src="https://img.shields.io/badge/Node.js-6DA55F?logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-%23404d59.svg?logo=express&logoColor=%2361DAFB" alt="Express">
  <img src="https://img.shields.io/badge/PostgreSQL-%23316192.svg?logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/JWT-black?logo=JSON%20web%20tokens" alt="JWT">
  <img src="https://img.shields.io/badge/AWS%20Lambda-FF9900?logo=awslambda&logoColor=white" alt="AWS Lambda">
</p>
 
<p align="center">API REST del proyecto semestral para Desarrollo Fullstack II</p>
<hr>

# Equipo Vio Coders
 
## Descripción
 
**Sonido Vivo – Backend** es la API REST que da soporte al [frontend de Sonido Vivo](https://github.com/pepestack/Sonido-Vivo), el sistema web de la **ficticia** tienda de instrumentos musicales y equipos de sonido ubicada en Viña del Mar, Región de Valparaíso. Se encarga de la gestión de usuarios, roles y autenticación mediante JWT, con persistencia en PostgreSQL, y puede ejecutarse como servidor local o desplegarse como función en AWS Lambda.
 
### Integrantes (Grupo 1):
- José Calderón (jv.calderon@duocuc.cl)
- Sebastian Navarro (seba.navarro@duocuc.cl)
- Sebastian Apablaza (se.apablazap@duocuc.cl)
## Tabla de Contenidos
- [Estructura del proyecto](#estructura-del-proyecto)
- [Ejecución](#ejecución)
- [Endpoints](#endpoints)
- [Bitácora](#bitácora)
- [KaijuApp](#kaijuapp-dsy1105)
## Estructura del proyecto
 
El sistema sigue una **arquitectura en capas** (rutas → controladores → servicios → repositorios), que separa la capa HTTP, la lógica de negocio y el acceso a datos para facilitar el mantenimiento y escalamiento del proyecto.
 
```
├── server.js            # Arranque local
├── lambda.js            # Handler para AWS Lambda
├── scripts/
│   └── semilla.js       # Usuarios de prueba
└── src/
    ├── config/          # Variables de entorno y conexión a PostgreSQL
    ├── db/              # Esquema SQL
    ├── middlewares/
    ├── routes/
    ├── controllers/
    ├── services/
    ├── repositories/
    ├── security/        # Firma de tokens JWT
    └── utils/           # Validaciones y errores HTTP
```
 
## Ejecución
 
Para ejecutar el sistema debe tener instalado Node, npm y PostgreSQL en su equipo.
 
Luego clone el repositorio con `git clone`, entre al directorio de Sonido-Vivo-Backend y ejecute `npm install`
 
Copie el archivo `.env.example` como `.env` y complete los datos de conexión a la base de datos y la variable `JWT_SECRET` (obligatoria, sin ella la API no inicia). Si se conecta a Amazon RDS, defina `DB_SSL=true`.
 
Cree las tablas y cargue los usuarios de prueba (contraseña `1234`):
 
`psql -d sonido_vivo -f src/db/schema.sql`
 
`npm run db:seed`
 
Una vez configurado ejecute `npm run dev`
 
Ya iniciada, la API queda disponible por defecto en:
 
`http://localhost:3000`
 
Para detener el servidor, presione:
 
`Ctrl + C`
 
### Requisitos
- Node.js 24.x o superior
- npm 11.x o superior
- PostgreSQL 14 o superior
## Endpoints
 
| Método | Ruta | Acceso | Qué hace |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Público | Inicia sesión y devuelve un token JWT de tipo Bearer |
| `POST` | `/api/v1/auth/registro` | Público | Registra un nuevo usuario con rol `Cliente` |
| `GET` | `/api/v1/usuarios` | Administrador | Lista todos los usuarios |
| `GET` | `/api/v1/usuarios/:id` | Administrador | Obtiene un usuario por su id |
| `POST` | `/api/v1/usuarios` | Administrador | Crea un usuario con el rol indicado |
| `PUT` | `/api/v1/usuarios/:id` | Administrador | Modifica los datos y el rol de un usuario (el RUN no se modifica) |
| `DELETE` | `/api/v1/usuarios/:id` | Administrador | Desactiva un usuario (eliminación lógica) |

Las rutas protegidas requieren el encabezado `Authorization: Bearer <token>`. Sin token o con un token inválido o expirado responden `401`; con un rol sin permiso responden `403`.

## Estado del proyecto

## Estado del proyecto

| Funcionalidad | Diseñado | Implementado | Probado |
|---|:---:|:---:|:---:|
| Tablas `roles` y `usuarios` en PostgreSQL | ✅ | ✅ | ✅ |
| Inicio de sesión con JWT | ✅ | ✅ | ✅ |
| Registro de usuarios (rol inicial `Cliente`) | ✅ | ✅ | ✅ |
| CRUD de usuarios (solo Administrador) | ✅ | ✅ | ✅ |
| Rutas protegidas: `401` sin token o token inválido, `403` por rol | ✅ | ✅ | ✅ |
| Un usuario no accede a datos de otro | ✅ | ✅ | ✅ |
| Despliegue en AWS (RDS + Lambda) | ✅ | ✅ | ✅ |
| Documentación con Swagger/OpenAPI | ✅ | ✅ | ✅ |
| Inicio de sesión y registro del frontend conectados a la API | ⬜ | ⬜ | ⬜ |
| CRUD del catálogo (instrumentos, equipos y accesorios) | ⬜ | ⬜ | ⬜ |
| Pedidos: no puede superar el stock (`409`); el cliente ve solo los suyos | ⬜ | ⬜ | ⬜ |

✅ Hecho · 🟨 En avance · ⬜ Pendiente


## KaijuApp (DSY1105)
Por temas de simplicidad, se integró una API independiente (en estricto rigor, otro grupo de endpoints) para la aplicación móvil [KaijuApp](https://github.com/pepestack/KaijuApp), con su propia tabla, roles y tokens JWT, éstos últimos no son intercambiables con los tokens de Sonido Vivo.

La API cuenta con login y CRUD de usuarios en `/api/v1/kaiju`:
- `POST /api/v1/kaiju/auth/login` (público; errores por campo en `detalles`)
- `GET|POST /api/v1/kaiju/usuarios`, `GET|PUT|DELETE /api/v1/kaiju/usuarios/:id` (requieren JWT y rol Administrador; DELETE es lógico, o sea que desactiva el usuario y no lo elimina de la base de datos)

| Correo | Rol | Contraseña |
|---|---|---|
| admin.kaiju@duoc.cl | Administrador | 1234 |
| encargado.kaiju@duoc.cl | Encargado de inventario | 1234 |
| vendedor.kaiju@duoc.cl | Vendedor | 1234 |

## Documentación (Swagger)

La API está documentada con OpenAPI 3 y se puede probar desde el navegador con Swagger UI.

| Recurso | Local | Desplegado |
|---|---|---|
| Swagger UI | http://localhost:3000/api-docs | `<URL de Lambda/EC2>/api-docs` |
| Especificación JSON | http://localhost:3000/api-docs.json | `<URL de Lambda/EC2>/api-docs.json` |

La documentación se divide en tres secciones:

- **Autenticación**: login y registro de Sonido Vivo.
- **Usuarios**: CRUD de usuarios de Sonido Vivo (solo Administrador).
- **KaijuApp**: login y CRUD de usuarios de KaijuApp (solo para Administrador de Kaiju).

### Probar rutas protegidas

1. Ejecuta el login que corresponda con **Try it out**:
   - Sonido Vivo: `POST /api/v1/auth/login` (ej. `admin@duoc.cl` / `1234`).
   - KaijuApp: `POST /api/v1/kaiju/auth/login` (ej. `admin.kaiju@duoc.cl` / `1234`).
2. Copia el `accessToken` de la respuesta.
3. Presiona **Authorize** al inicio de la página, pega el token (sin escribir `Bearer`) y confirma.
4. Las rutas con candado ya se pueden ejecutar. El token queda guardado aunque se recargue la página.

Recordar que los tokens no son intercambiables entre Sonido Vivo y KaijuApp. Para cambiar de app, vuelve a **Authorize**, cierra la sesión (**Logout**) y pega el otro token.

## Bitácora

### 2026-11-19
- **Sebastian Navarro (sebi-nvrro)**: Implementó el CRUD de usuarios en `/api/v1/usuarios` (listar, obtener, crear, modificar y eliminar), protegido con el middleware de autenticación y restringido al rol `Administrador`. Los usuarios se identifican por su RUN, la eliminación es lógica (`activo = false`) y se reutilizan las validaciones del registro, respondiendo `400`, `404` o `409` según corresponda. Verificó en Postman todos los casos, incluidos los `401` y `403`.

- **José Calderón**: Agregó el middleware que verifica el JWT (`401`) y controla los roles (`403`), y la variable `CORS_ORIGIN` para configurar los orígenes permitidos. Cambió las rutas de `/api/v1/usuarios` para identificar al usuario por su `id` en vez del RUN, evitando exponer un dato personal en la URL (logs e historial del navegador); un id no numérico responde `400`.

### 2026-11-16
- **Sebastian Apablaza**: Implementó `POST /api/v1/auth/registro` usando las validaciones existentes. El backend guarda el usuario en PostgreSQL con la contraseña protegida con bcrypt y asigna el rol `Cliente`. Verificó en EC2 el registro (`201 Created`) y el inicio de sesión con la cuenta creada (`200 OK`).
 
- **Sebastian Navarro (sebi-nvrro)**: Configuró la base del proyecto (dependencias, variables de entorno y conexión a PostgreSQL con soporte SSL para RDS), creó las tablas de roles y usuarios, montó el servidor Express con manejo global de errores, implementó el inicio de sesión con JWT y las validaciones del registro (RUN, correo y campos obligatorios), agregó usuarios de prueba con contraseñas hasheadas y dejó la API lista para AWS Lambda con `serverless-http`.
