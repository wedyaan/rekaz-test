const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: false });

const { getDatabaseBlobById, saveBlob } = require("./services/database");
const { saveLocal, getLocalBlobById } = require("./services/local");
const { generateToken, authenticateToken } = require("./services/auth");

const app = express();
app.use(cors());
const port = 3001;
app.use(express.json());

const storageType = "database";

app.listen(port, () => {
  console.log(`Applistening on port ${port}`);
});

app.use("/", express.static(path.join(__dirname, "frontEnd/build")));

app.post("/login", (req, res) => {
  const username = req.body.username;
  const user = { name: username };
  const token = generateToken(user);
  res.json({ token });
});

app.get("/v1/blobs/:id", authenticateToken, async (req, res) => {
  const id = req.params.id;
  let blob;
  if (storageType === "local") {
    blob = await getLocalBlobById(id);
  }
  if (storageType === "database") {
    blob = await getDatabaseBlobById(id);
  }
  res.send(blob);
});

app.post("/v1/blobs", authenticateToken, jsonParser, async (req, res) => {
  const blob = req.body;
  const matches = blob.data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return res.status(400).json({ error: "Invalid base64 data" });
  }

  const buffer = Buffer.from(matches[2], "base64");
  const size = buffer.length;
  const newBlob = {
    ...blob,
    size: size,
    created_at: new Date(),
  };

  if (storageType === "local") {
    const saveFileRes = await saveLocal(matches, newBlob, buffer, size);
    res.status(saveFileRes.status).send(saveFileRes.value);
  }

  if (storageType === "database") {
    const blobRes = await saveBlob(blob.id, blob.data, size);
    res.status(blobRes.status).send(blobRes.value);
  }
});
