const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Certificate = require("./models/Certificate");
const cors = require("cors");

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(cors());

// MongoDB connection using mongoose
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1); // Exit the process if MongoDB connection fails
  });

// Middleware for parsing JSON requests
app.use(express.json());

// POST route to create a new certificate and save it to MongoDB
app.post("/api/certificates", async (req, res) => {
  try {
    const {
      certId,
      name,
      studentId,
      father,
      mother,
      degree,
      department,
      cgpa,
      session,
      createdAt,
    } = req.body;

    // Create a new certificate instance
    const newCertificate = new Certificate({
      certId,
      name,
      studentId,
      father,
      mother,
      degree,
      department,
      cgpa,
      session,
      createdAt,
    });

    // Save the certificate to the database
    await newCertificate.save();

    res.status(201).json({
      message: "Certificate created successfully!",
      certificate: newCertificate,
    });
  } catch (err) {
    console.error("Error creating certificate:", err);
    res.status(500).json({ error: "Failed to create certificate" });
  }
});

// Route to fetch all certificates
app.get("/api/certificates", async (req, res) => {
  try {
    const certificates = await Certificate.find();
    res.json(certificates);
  } catch (err) {
    console.error("Error fetching certificate history:", err);
    res.status(500).json({ error: "Failed to fetch certificate history" });
  }
});

// Set up the server to listen on the configured port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
