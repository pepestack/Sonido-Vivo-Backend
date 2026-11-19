require("dotenv").config();

if (!process.env.JWT_SECRET) throw new Error("Falta JWT_SECRET en el .env");

module.exports = {
  puerto: Number(process.env.PORT) || 3000,
  corsOrigen: process.env.CORS_ORIGIN || "http://localhost:5173",
  db: {
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  jwt: {
    secreto: process.env.JWT_SECRET,
    expira: process.env.JWT_EXPIRA || "1h",
  },
};
