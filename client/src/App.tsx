import "./App.css";
import {
  PayPalButtons,
  PayPalHostedField,
  PayPalHostedFieldsProvider,
  PayPalScriptProvider,
  usePayPalHostedFields,
} from "@paypal/react-paypal-js";
import { PayPalButtonsComponentOptions } from "@paypal/paypal-js/types/components/buttons";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.scss";
import bookImage from "./assets/book.jpg";
import {
  LeftOutlined,
  LoadingOutlined,
  CloseOutlined,
} from "@ant-design/icons";

const axiosInstance = axios.create({
  baseURL: "http://localhost:3001",
});

const downloadFile = (url: string) => {
  const link = document.createElement("a");
  link.setAttribute("download", "");
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

interface PayButtonProps {
  onApprove: (orderId: string) => Promise<void>;
}

interface PaymentProps {
  clientToken: string;
  clientId: string;
  onCancel: () => void;
}

// Function component PayButton
const PayButton = (props: PayButtonProps) => {
  const { onApprove } = props;

  const [paying, setPaying] = useState<boolean>(false);

  const hostedFields = usePayPalHostedFields();

  const submitHandler = async () => {
    if (typeof hostedFields.cardFields?.submit !== "function") return; // check if "submit()" exists

    setPaying(true);

    // card's full name, same as billing address
    const order = await hostedFields.cardFields?.submit({
      cardholderName: "John Wick",
    });

    // order approved!
    await onApprove(order.orderId);

    setPaying(false); // finish payment, set back to false
  };

  return (
    <button className={styles.button} onClick={submitHandler}>
      {paying ? "Paying..." : "Pay"}
    </button>
  );
};

// Function component Payment
const Payment = (props: PaymentProps) => {
  const { clientToken, clientId, onCancel } = props;

  // create order
  const createOrder = async (): Promise<string> => {
    const response = await axiosInstance.post("/api/orders");
    return response.data.id;
  };

  const onApprove = async (orderId: string) => {
    // capture result
    const {
      data: { orderData, url },
    } = await axiosInstance.post(`/api/orders/${orderId}/capture`);
    console.log("Capture result", orderData);

    // print transaction
    const transaction = orderData.purchase_units[0].payments.captures[0];
    console.log(`Transaction ${transaction.status}: ${transaction.id}`);

    downloadFile(url);

    alert(
      url
        ? "Payment successful, start download..."
        : "Payment failed, please try again"
    );
  };

  const onError: PayPalButtonsComponentOptions["onError"] = (error) => {
    console.log("onError", error);
    alert(error.message);
  };

  return (
    <div className={styles.payment}>
      <div className={styles.header}>
        <span>Purchase book</span>
        <CloseOutlined className={styles.icon} onClick={onCancel} />
      </div>

      <PayPalScriptProvider
        options={{
          components: "hosted-fields,buttons",
          "client-id": clientId,
          "data-client-token": clientToken,
        }}
      >
        <PayPalHostedFieldsProvider createOrder={() => createOrder()}>
          <PayPalHostedField
            id="card-number"
            className={styles.input}
            hostedFieldType="number"
            options={{ selector: "#card-number", placeholder: "Card Number" }}
          />
          <PayPalHostedField
            id="cvv"
            className={styles.input}
            hostedFieldType="cvv"
            options={{ selector: "#cvv", placeholder: "CVV" }}
          />
          <PayPalHostedField
            id="expiration-date"
            className={styles.input}
            hostedFieldType="expirationDate"
            options={{
              selector: "#expiration-date",
              placeholder: "MM/YY",
            }}
          />

          <PayButton onApprove={onApprove} />

          <PayPalButtons
            className={styles.buttons}
            style={{
              color: "blue",
              layout: "vertical",
              label: "paypal",
            }}
            createOrder={() => createOrder()}
            onApprove={(data) => onApprove(data.orderID)}
            onError={onError}
            disabled={false}
          />
        </PayPalHostedFieldsProvider>
      </PayPalScriptProvider>
    </div>
  );
};

export default function App() {
  const [paying, setPaying] = useState<boolean>(false);
  const [clientToken, setClientToken] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");

  const fetchClientToken = async () => {
    const { data } = await axiosInstance.get("/api/client_token");

    setClientId(data.clientId);
    setClientToken(data.clientToken);
  };

  // synchronize with server
  useEffect(() => {
    fetchClientToken().then();
  }, []);

  const isReady = useMemo(
    () => clientId && clientToken,
    [clientId, clientToken]
  ); // memoization

  return (
    <div className={styles.app}>
      <div className={styles.wrapper}>
        {/* header */}
        <div className={styles.book}>
          <header className={styles.header}>
            <LeftOutlined className={styles.icon} />
          </header>

          <img className={styles.bookImage} src={bookImage} alt="Book" />

          <p className={styles.bookTitle}>JavaScript 高级程序设计</p>

          <p className={styles.author}>马特·弗里斯比</p>
        </div>

        {/* description */}
        <div className={styles.desc}>
          <div className={styles.descHeader}>
            <span className={styles.descTitle}>Book Description</span>
            <span className={styles.price}>$1.00</span>
          </div>

          <p className={styles.descText}>
            本书是JavaScript经典图书的新版。第4版全面、深入地介绍了JavaScript开发者必须掌握的前端开发技术，涉及JavaScript的基础特性和高级特性。书中详尽讨论了JavaScript的各个方面，从JavaScript的起源开始，逐步讲解到新出现的技术，其中重点介绍ECMAScript和DOM标准。
          </p>
        </div>

        {/* Tag */}
        <div className={styles.tagList}>
          <span className={styles.green}>JavaScript</span>
          <span className={styles.red}>Frontend developer</span>
          <span className={styles.blue}>Advanced</span>
        </div>

        {/*Purchase button*/}
        <button
          className={styles.purchaseButton}
          onClick={() => setPaying(true)}
        >
          {clientToken ? "Order" : <LoadingOutlined />}
        </button>
      </div>

      {isReady && paying && (
        <div className={styles.mask} onClick={() => setPaying(false)}></div>
      )}

      {isReady && paying && (
        <Payment
          clientToken={clientToken}
          clientId={clientId}
          onCancel={() => setPaying(false)}
        />
      )}
    </div>
  );
}

/*
Reference: https://www.npmjs.com/package/@paypal/react-paypal-js
 */
