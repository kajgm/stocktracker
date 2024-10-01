import express from 'express';
const app = express();
const port = 3000;

app.put('/api/tickers', (req, res) => {
  const stockTickers = req.query.stock;
  const cryptoTickers = req.query.crypto;

  let resString = '';

  if (stockTickers != undefined) {
    app.set('stockTickers', stockTickers);
    resString += 'updated stock tickers ';
  }
  if (cryptoTickers != undefined) {
    app.set('cryptoTickers', cryptoTickers);
    resString += 'updated crypto tickers ';
  }

  res.send(resString);
});

app.get('/api/tickers', (req, res) => {
  const stock = app.get('stockTickers');
  const crypto = app.get('cryptoTickers');

  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.json({ stockTickers: stock, cryptoTickers: crypto });
});

app.listen(port, () => {
  console.log(`Stocktracker server listening on port ${port}`);
});
