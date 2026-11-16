const app = require("./src/app");
const config = require("./src/config/env");

app.listen(config.puerto, () =>
  console.log(`API lista en http://localhost:${config.puerto}`),
);
