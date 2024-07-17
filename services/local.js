const fs = require("fs").promises;
const path = require("path");
const { savemetadata, getBlodmetadataById } = require("./database");

async function saveLocal(matches, newBlob, buffer, size) {
  const fileType = matches[1];
  const extension = fileType.split("/")[1];
  const filename = `${newBlob.id}.${extension}`;
  const filePath = path.join(__dirname, "../blobs", filename);

  try {
    await fs.writeFile(filePath, buffer);
    await savemetadata(newBlob.id, size);
    console.log("Blob file saved successfully");
    return {
      status: 201,
      value: { error: "Blob file saved successfully" },
    };
  } catch (err) {
    if (err.sqlMessage) {
      fs.unlink(filePath);
    }
    console.error("Error saving blob file:", err);
    return {
      status: 500,
      value: { error: "Failed to save blob file" },
    };
  }
}

async function getLocalBlobById(id) {
  const dirPath = path.join(__dirname, "../blobs");
  const files = await fs.readdir(dirPath);
  const file = files.find((f) => f.startsWith(id));
  const extension = path.extname(file).substring(1);
  let mimeType;
  switch (extension) {
    case "png":
      mimeType = "image/png";
      break;
    case "jpg":
    case "jpeg":
      mimeType = "image/jpeg";
      break;
    case "gif":
      mimeType = "image/gif";
      break;
    case "pdf":
      mimeType = "application/pdf";
      break;
    default:
      mimeType = "application/octet-stream";
  }
  console.log("MIME type:", mimeType);
  const metadata = await getBlodmetadataById(id);
  const base64 = await fs.readFile(`${dirPath}/${file}`, "base64");
  const base64WithMimeType = `data:${mimeType};base64,${base64}`;
  const blob = {
    id: metadata.id,
    data: base64WithMimeType,
    size: metadata.size,
    created_at: metadata.created_at,
  };
  return blob;
}

module.exports = { saveLocal, getLocalBlobById };
