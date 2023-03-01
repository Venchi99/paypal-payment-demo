const axios = require("axios");
const { getBookDownloadUrl } = require("./book-service");

const { CLIENT_ID, CLIENT_SECRET } = process.env;

const base = "https://api-m.sandbox.paypal.com";
const axiosInstance = axios.create({
  baseURL: base,
});

/*
Reference:

1. generate access token:
https://developer.paypal.com/docs/multiparty/get-started/#exchange-your-api-credentials-for-an-access-token

2. create order:
https://developer.paypal.com/docs/api/orders/v2/

3. capture payment & generate client token:
https://developer.paypal.com/docs/multiparty/checkout/advanced/integrate/

*/

// Generate Access Token (用它连接口)
const generateAccessToken = async () => {
  const response = await axiosInstance.request({
    method: "post",
    url: "/v1/oauth2/token",
    data: "grant_type=client_credentials",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      //'Access-Control-Allow-Origin': 'https://www.sandbox.paypal.com',
    },
    auth: {
      //basic auth
      username: CLIENT_ID,
      password: CLIENT_SECRET,
    },
  });
  return response.data.access_token;
};

// create order
const createOrder = async () => {
  const accessToken = await generateAccessToken();

  const response = await axiosInstance.post(
    "/v2/checkout/orders",
    {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: "1.00",
          },
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        //'Access-Control-Allow-Origin': 'https://www.sandbox.paypal.com',
      },
    }
  );
  return response.data;
};

// Capture payment
const capturePayment = async (orderId) => {
  const accessToken = await generateAccessToken();

  const response = await axiosInstance.post(
    `/v2/checkout/orders/${orderId}/capture`,
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        //'Access-Control-Allow-Origin': 'https://www.sandbox.paypal.com',
      },
    }
  );

  if (
    response?.data?.purchase_units[0].payments.captures[0].status ===
    "COMPLETED"
  ) {
    return {
      orderData: response.data,
      url: getBookDownloadUrl(),
    };
  } else {
    return {
      orderData: response.data,
      url: "",
    };
  }
};

// generate client token
const generateClientToken = async () => {
  const accessToken = await generateAccessToken();

  const response = await axiosInstance.post(
    "v1/identity/generate-token",
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        //'Access-Control-Allow-Origin': 'https://www.sandbox.paypal.com',
      },
    }
  );
  return response.data.client_token;
};

module.exports = {
  createOrder,
  capturePayment,
  generateClientToken,
};
