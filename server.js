const express = require("express");
const WebSocket = require("ws");

const app = express();

app.get("/ship", async (req, res) => {
  const imo = req.query.imo ? parseInt(req.query.imo) : null;
  const mmsi = req.query.mmsi ? parseInt(req.query.mmsi) : null;

  if (!imo && !mmsi) {
    return res.status(400).send("Falta el parámetro ?imo=XXXX o ?mmsi=XXXX");
  }

  const ws = new WebSocket("wss://stream.aisstream.io/v0/stream", {
    headers: {
      Authorization: "Bearer 05c8f44f515a484d7e3a8f5bf42ba02a03018622"
    }
  });

  let responded = false;

  ws.on("open", () => {
    const subscription = {
      Apikey: "05c8f44f515a484d7e3a8f5bf42ba02a03018622",
      BoundingBoxes: [[[-170, -60], [-30, 80]]], // América completa
      FiltersShip: {}
    };

    if (imo) subscription.FiltersShip.IMO = [imo];
    if (mmsi) subscription.FiltersShip.MMSI = [mmsi];

    console.log("Suscripción enviada:", subscription);
    ws.send(JSON.stringify(subscription));
  });

  ws.on("message", (data) => {
    try {
      const json = JSON.parse(data);
      if (json.Ship && !responded) {
        responded = true;
        ws.close();
        console.log("Mensaje recibido de AIS Stream");
        res.json(json);
      }
    } catch (err) {
      console.error("Error parseando mensaje:", err);
    }
  });

  ws.on("error", (err) => {
    if (!responded) {
      responded = true;
      console.error("Error WebSocket:", err.message);
      res.status(500).send("Error al conectar al stream: " + err.message);
    }
  });

  // Timeout de 15 segundos
  setTimeout(() => {
    if (!responded) {
      responded = true;
      ws.close();
      res.status(504).send("Timeout sin datos AIS (25s sin mensajes)");
    }
  }, 25000);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor escuchando en puerto " + PORT));
