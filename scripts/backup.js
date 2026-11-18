const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const MONGO_URI = "mongodb://localhost:27017/SDC";

async function backupDatabase() {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("Database connected");

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    const backupDir = path.join(__dirname, "db_backup");

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    for (const collection of collections) {
      const collectionName = collection.name;

      const data = await db.collection(collectionName).find({}).toArray();

      const filePath = path.join(backupDir, `${collectionName}.json`);

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      console.log(`Backed up: ${collectionName}`);
    }

    console.log("\nBackup completed successfully!");
    console.log(`Backup folder: ${backupDir}`);
  } catch (error) {
    console.error("Backup failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

backupDatabase();
