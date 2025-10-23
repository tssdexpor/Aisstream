const express = require("express");
const WebSocket = require("ws");

const app = express();

app.get("/ship", (req, res) => {
  const mmsi = req.query.mmsi ? parseInt(req.query.mmsi) : null;
  if (!mmsi) return res.status(400).send("Falta ?mmsi=");

  const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

  let done = false;

  ws.on("open", () => {
    const sub = {
      APIKey: "05c8f44f515a484d7e3a8f5bf42ba02a03018622",
      BoundingBoxes: [[[ -180, -90 ], [ 180, 90 ]]],
      FiltersShipMMSI: [mmsi],
      FilterMessageTypes: ["PositionReport"]
    };
    console.log("Suscripción enviada:", sub);
    ws.send(JSON.stringify(sub));
  });

  ws.on("message", data => {
    if (done) return;
    try {
      const msg = JSON.parse(data);
      if (msg.MetaData && msg.Message) {
        done = true;
        ws.close();
        return res.json(msg);
      }
    } catch (e) {
      console.error(e);
    }
  });

  setTimeout(() => {
    if (!done) {
      done = true;
      ws.close();
      res.status(504).send("Timeout sin datos AIS");
    }
  }, 15000);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor escuchando en puerto", PORT));
