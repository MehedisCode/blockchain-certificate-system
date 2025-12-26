const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Certificate = require("./models/Certificate");
const cors = require("cors");

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));

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
      instituteAddress,
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

    if (!instituteAddress) {
      return res.status(400).json({ error: "instituteAddress is required" });
    }

    // Check if a certificate already exists for this student and institute
    const existingCertificate = await Certificate.findOne({
      studentId,
      instituteAddress: instituteAddress.toLowerCase(),
    });

    if (existingCertificate) {
      return res.status(400).json({
        error: "This student already has a certificate from this institute.",
      });
    }

    // If no existing certificate, create the new one
    const newCertificate = new Certificate({
      certId,
      instituteAddress: instituteAddress.toLowerCase(),
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

    // Save certificate in MongoDB
    await newCertificate.save();

    res.status(201).json({
      message: "Certificate created successfully!",
      certificate: newCertificate,
    });
  } catch (err) {
    console.error("Error creating certificate:", err);
    res.status(500).json({ error: err.message });
  }
});

// Route to fetch all certificates
app.get("/api/certificates", async (req, res) => {
  try {
    console.log(req.query);
    const { instituteAddress } = req.query;

    if (!instituteAddress) {
      return res
        .status(400)
        .json({ error: "instituteAddress query is required" });
    }

    const certificates = await Certificate.find({
      instituteAddress: instituteAddress.toLowerCase(),
    }).sort({ createdAt: -1 });

    res.json(certificates);
  } catch (err) {
    console.error("Error fetching certificate history:", err);
    res.status(500).json({ error: err.message });
  }
});

// Set up the server to listen on the configured port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
