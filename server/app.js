require("dotenv").config(); // access .env for client id, client secret
const Koa = require("koa");
const cors = require("@koa/cors"); // 不同端口之前通讯
const serve = require("koa-static");
const mount = require("koa-mount");
const path = require("path");

const { routes } = require("./routes");

const app = new Koa();

app.use(cors({ origin: "http://localhost:5173" , credentials: true}));

app.use(mount("/static", serve(path.join(__dirname, "./static"))));

// API
app.use(routes);

// error handling
app.on("error", (error) => {
  console.error("Internal error", error);
});

// listen to port 3001
app.listen(3001);
console.log("服务器已打开，监听3001端口");
