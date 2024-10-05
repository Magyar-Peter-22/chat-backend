import { app, server, io, apiPath } from "./config.js";
import appRoutes from "./app/routes.js";
import ioRoutes from "./io/routes.js";
import httpProxy from "http-proxy";
const proxy = httpProxy.createProxyServer();

//app routes
app.use(apiPath, appRoutes);

//io routes
ioRoutes(io);

//server client
app.use('/', (req, res) => {
  try {
    console.log(`serving client for "${req.url}"`);
    proxy.web(req, res, { target: process.env.CLIENT_URL })
  }
  catch (err) {
    console.log("\nerror when serving client:\n");
    console.error(err);
  }
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});