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
| `GET` | `/api/v1/usuarios/:rut` | Administrador | Obtiene un usuario por su RUN |
| `POST` | `/api/v1/usuarios` | Administrador | Crea un usuario con el rol indicado |
| `PUT` | `/api/v1/usuarios/:rut` | Administrador | Modifica los datos y el rol de un usuario (el RUN no se modifica) |
| `DELETE` | `/api/v1/usuarios/:rut` | Administrador | Desactiva un usuario (eliminación lógica) |

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
| Despliegue en AWS (RDS + Lambda) | ✅ | 🟨 | 🟨 |
| Documentación con Swagger/OpenAPI | ⬜ | ⬜ | ⬜ |
| Inicio de sesión y registro del frontend conectados a la API | ⬜ | ⬜ | ⬜ |
| CRUD del catálogo (instrumentos, equipos y accesorios) | ⬜ | ⬜ | ⬜ |
| Pedidos: no puede superar el stock (`409`); el cliente ve solo los suyos | ⬜ | ⬜ | ⬜ |

✅ Hecho · 🟨 En avance · ⬜ Pendiente

## Bitácora

### 2026-11-19
- **Sebastian Navarro (sebi-nvrro)**: Implementó el CRUD de usuarios en `/api/v1/usuarios` (listar, obtener, crear, modificar y eliminar), protegido con el middleware de autenticación y restringido al rol `Administrador`. Los usuarios se identifican por su RUN, la eliminación es lógica (`activo = false`) y se reutilizan las validaciones del registro, respondiendo `400`, `404` o `409` según corresponda. Verificó en Postman todos los casos, incluidos los `401` y `403`.

- **José Calderón**: Agregó el middleware que verifica el JWT (`401`) y controla los roles (`403`), y la variable `CORS_ORIGIN` para configurar los orígenes permitidos.

### 2026-11-16
- **Sebastian Apablaza**: Implementó `POST /api/v1/auth/registro` usando las validaciones existentes. El backend guarda el usuario en PostgreSQL con la contraseña protegida con bcrypt y asigna el rol `Cliente`. Verificó en EC2 el registro (`201 Created`) y el inicio de sesión con la cuenta creada (`200 OK`).
 
- **Sebastian Navarro (sebi-nvrro)**: Configuró la base del proyecto (dependencias, variables de entorno y conexión a PostgreSQL con soporte SSL para RDS), creó las tablas de roles y usuarios, montó el servidor Express con manejo global de errores, implementó el inicio de sesión con JWT y las validaciones del registro (RUN, correo y campos obligatorios), agregó usuarios de prueba con contraseñas hasheadas y dejó la API lista para AWS Lambda con `serverless-http`.
