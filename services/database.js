
require('dotenv').config();
const mysql = require('mysql');

const con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});


async function saveBlob(id, data, size) {
  try {
    con.query("INSERT INTO blobs (id, data) VALUES (?, ?)", [id, data]);
    await savemetadata(id, size);
    return {
      status: 201,
      value: { id, data },
    };
  } catch (error) {
    console.error("Error storing blob:", error);
    return {
      status: 500,
      value: { error: "Failed to save blob data" },
    };
  }
}

async function savemetadata(id, size) {
  try {
    const createdAt = new Date().toISOString().slice(0, 19).replace("T", " ");
    return new Promise((resolve, reject) => {
      con.query(
        "INSERT INTO metadata (id, size, created_at) VALUES (?, ?, ?)",
        [id, size, createdAt],
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result[0]);
          }
        }
      );
    });
  } catch (error) {
    console.error("Error storing blob:", error);
    return {
      status: 500,
      value: { error: "Internal Server Error" },
    };
  }
}

function getDatabaseBlobById(id) {
  return new Promise((resolve, reject) => {
    const query = `
    SELECT b.id, b.data, m.size, m.created_at 
    FROM blobs b
    JOIN metadata m ON b.id = m.id
    WHERE b.id = ?
  `;
    con.query(query, [id], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result[0]);
      }
    });
  });
}

function getBlodmetadataById(id) {
  return new Promise((resolve, reject) => {
    const query = `
    SELECT id, size, created_at 
    FROM metadata
    WHERE id = ?  
  `;
    con.query(query, [id], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result[0]);
      }
    });
  });
}

module.exports = {
  saveBlob,
  savemetadata,
  getDatabaseBlobById,
  getBlodmetadataById,
};
