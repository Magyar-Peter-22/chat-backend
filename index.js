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
app.use('/', (req, res) => { proxy.web(req, res, { target: 'http://localhost:3001' }) });

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});