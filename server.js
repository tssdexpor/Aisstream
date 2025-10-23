const express = require("express");
const WebSocket = require("ws");

const app = express();

app.get("/ship", async (req, res) => {
  const imo = parseInt(req.query.imo);
  if (!imo) return res.status(400).send("Falta el parámetro IMO");

  const ws = new WebSocket("wss://stream.aisstream.io/v0/stream", {
    headers: {
      Authorization: "Bearer 05c8f44f515a484d7e3a8f5bf42ba02a03018622"
    }
  });

  let responded = false;

  ws.on("open", () => {
    const subscription = {
      Apikey: "TU_TOKEN_DE_AISSTREAM",
      BoundingBoxes: [],
      FiltersShip: { IMO: [imo] }
    };
    ws.send(JSON.stringify(subscription));
  });

  ws.on("message", (data) => {
    const json = JSON.parse(data);
    if (json.Ship && !responded) {
      responded = true;
      ws.close();
      res.json(json);
    }
  });

  ws.on("error", (err) => {
    if (!responded) {
      responded = true;
      res.status(500).send("Error al conectar al stream: " + err.message);
    }
  });

  // timeout si AIS Stream no devuelve datos en 5 segundos
  setTimeout(() => {
    if (!responded) {
      responded = true;
      ws.close();
      res.status(504).send("Timeout sin datos AIS");
    }
  }, 30000);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor escuchando en puerto " + PORT));
