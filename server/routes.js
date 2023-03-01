const Router = require("koa-router");
const {
  createOrder,
  capturePayment,
  generateClientToken,
} = require("./paypal-service");
const router = new Router();

// create order
router.post("/api/orders", async (ctx) => {
  //console.log("create order")
  ctx.body = await createOrder();
});

// capture order
router.post("/api/orders/:orderId/capture", async (ctx) => {
    //console.log("capture order")
  const { orderId } = ctx.params;
  ctx.body = await capturePayment(orderId);
});

// generate client token
router.get("/api/client_token", async (ctx) => {
  const clientToken = await generateClientToken();
  ctx.body = {
    clientId: process.env.CLIENT_ID,
    clientToken,
  };
});

module.exports = {
  routes: router.routes(),
};
