import express from "express";
const app = express();
const port = 3000;

app.get("/api/get/tickers", (req, res) => {
  const stock = app.get("stockTickers");
  const crypto = app.get("cryptoTickers");

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.json({ stockTickers: stock, cryptoTickers: crypto });
});

app.put("/api/set/tickers", (req, res) => {
  const stockTickers = req.query.stock;
  const cryptoTickers = req.query.crypto;

  let resString = "";

  if (stockTickers != undefined) {
    app.set("stockTickers", stockTickers);
    resString += "updated stock tickers ";
  }
  if (cryptoTickers != undefined) {
    app.set("cryptoTickers", cryptoTickers);
    resString += "updated crypto tickers ";
  }

  res.send(resString);
});

app.get("/api/set/tickers", (req, res) => {
  const stockTickers = req.query.stock;
  const cryptoTickers = req.query.crypto;

  let resString = "";

  if (stockTickers != undefined) {
    app.set("stockTickers", stockTickers);
    resString += "Updated Stock Tickers to be: " + stockTickers + "\n";
  }
  if (cryptoTickers != undefined) {
    app.set("cryptoTickers", cryptoTickers);
    resString += "Updated Crypto Tickers to be: " + cryptoTickers + "\n";
  }

  res.send(resString);
});

app.listen(port, () => {
  console.log("Stocktracker server listening on port " + port);
});
