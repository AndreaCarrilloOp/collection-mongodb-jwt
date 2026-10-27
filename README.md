# Jazz Collection

[![Academic Project](https://img.shields.io/badge/Academic-Project-31465C?style=flat-square)](#jazz-collection)
[![Vue.js](https://img.shields.io/badge/Vue.js-3-42B883?style=flat-square&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Netlify Functions](https://img.shields.io/badge/Netlify-Functions-00AD9F?style=flat-square&logo=netlify&logoColor=white)](https://docs.netlify.com/build/functions/overview/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![JWT](https://img.shields.io/badge/Auth-JWT-6B4F8A?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![REST API](https://img.shields.io/badge/API-REST-6B4F32?style=flat-square)](#servicio-rest)

Catálogo temático de música jazz desarrollado con **Vue.js**, un servicio **REST en Netlify Functions**, **MongoDB Atlas** y autenticación mediante **JSON Web Tokens (JWT)**. 

**Aplicación en Netlify:** [Jazz Collection](https://collection-jwt.netlify.app/login)

## Tecnologías

| Componente | Tecnología |
|---|---|
| Frontend | Vue.js 3 y Vite |
| Servicio REST | Node.js y Netlify Functions |
| Base de datos | MongoDB Atlas |
| Autenticación | JWT (`jsonwebtoken`) y `bcryptjs` |
| Publicación | Netlify |

## Catálogo

Se conservan las tres entidades originales y sus relaciones:

| Entidad | Colección MongoDB | Registros iniciales |
|---|---|---:|
| Álbumes | `albums` | 12 |
| Artistas | `artists` | 6 |
| Subgéneros | `subgenres` | 6 |

Los registros incluyen sus imágenes. Los álbumes mantienen referencias a los artistas y subgéneros correspondientes.

## Autenticación y autorización

- El sitio dispone de **registro, inicio y cierre de sesión**.
- Las contraseñas se almacenan mediante un **hash**, nunca en texto plano.
- El inicio de sesión genera un **JWT firmado y con expiración**, enviado en las solicitudes protegidas como `Authorization: Bearer <token>`.
- El frontend guarda el token durante la sesión y redirige al inicio de sesión cuando recibe una respuesta **401**.
- Los usuarios con rol `user` pueden consultar los catálogos; **solo `admin` puede crear, editar y eliminar** registros. Las solicitudes sin permiso reciben **403**.

El registro público asigna el rol `user`. Para habilitar una cuenta administradora de prueba, se registra primero la cuenta y luego se actualiza su campo `role` a `admin` en la colección `users` de MongoDB Atlas. Se debe cerrar sesión e ingresar nuevamente para obtener un token actualizado.

## Vista previa de la aplicación

Las siguientes capturas muestran el acceso al sistema y la diferencia de permisos entre los roles `user` y `admin`.

### Inicio de sesión

![Pantalla de inicio de sesión de Jazz Collection](docs/login-preview.png)

### Vista de usuario (`user`)

Permite consultar los catálogos sin mostrar las acciones para crear, editar o eliminar registros.

![Catálogo de Jazz Collection con rol user](docs/user-view.png)

### Vista de administrador (`admin`)

Permite consultar los catálogos y muestra las acciones para crear, editar y eliminar registros.

![Catálogo de Jazz Collection con rol admin](docs/admin-view.png)


## Instalación y ejecución local

**Requisitos:** Node.js, npm y un clúster de MongoDB Atlas con un usuario de base de datos autorizado y acceso de red configurado.

1. Instalar las dependencias:

   ```bash
   npm install
   ```

2. Crear el archivo `.env` a partir de `.env.example` y completar las variables:

   ```dotenv
   MONGODB_URI=mongodb+srv://USUARIO:CLAVE@CLUSTER.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB=jazz_collection
   JWT_SECRET=REEMPLAZAR_POR_UN_SECRETO_ALEATORIO_DE_AL_MENOS_32_CARACTERES
   ```

   La variable opcional `MONGODB_DNS_SERVERS` está documentada en `.env.example` y solo se utiliza si el entorno presenta errores de resolución DNS.

3. Iniciar el frontend y las funciones REST:

   ```bash
   npm run dev
   ```

4. Abrir **http://localhost:8888**.

## Servicio REST

El servicio expone los recursos `albums`, `artists` y `subgenres` bajo `/api/`, conservando las operaciones del Proyecto 1:

| Método | Ruta | Función |
|---|---|---|
| `GET` | `/api/:recurso` | Listar registros |
| `GET` | `/api/:recurso/:id` | Consultar un registro |
| `POST` | `/api/:recurso` | Crear un registro (`admin`) |
| `PUT` | `/api/:recurso/:id` | Editar un registro (`admin`) |
| `DELETE` | `/api/:recurso/:id` | Eliminar un registro (`admin`) |
| `POST` | `/api/auth/register` | Registrar un usuario |
| `POST` | `/api/auth/login` | Iniciar sesión y obtener JWT |

Las rutas de consulta también requieren iniciar sesión, según el diseño elegido para este proyecto.

---

*Proyecto académico desarrollado para el curso  Sistemas Distribuidos*
