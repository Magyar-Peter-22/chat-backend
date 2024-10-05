import { app, server, io } from "./config.js";
import appRoutes from "./app/routes.js";
import ioRoutes from "./io/routes.js";

//app routes
app.use( appRoutes);

//io routes
ioRoutes(io);

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});