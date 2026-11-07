const express = require("express");
const mysql = require("mysql2/promise");
const mysql = require("mysql2/promise");
const path = require('path');
require('dotenv').config({ 
  path: path.resolve(__dirname, '../../includes/.env') 
});

const AUTODEV_API_KEY = process.env.AUTODEV_API_KEY;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function fetchVehicleRow(vehicleId) {
  const [rows] = await pool.query(
    `SELECT id, year, make, model, estimated_value
       FROM vehicles
      WHERE id = ?
      LIMIT 1`,
    [vehicleId]
  );
  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id,
    year: row.year,
    make: row.make,
    model: row.model,
    estimatedValue: row.estimated_value ? Number(row.estimated_value) : null,
  };
}

async function getAutoDevAverage(vehicle) {
  if (!AUTODEV_API_KEY) {
    throw new Error("Missing AUTODEV_API_KEY environment variable");
  }

  const params = new URLSearchParams({
    apiKey: AUTODEV_API_KEY,
    "vehicle.year": String(vehicle.year),
    "vehicle.make": String(vehicle.make).toLowerCase(),
    "vehicle.model": String(vehicle.model).toLowerCase(),
  });

  const response = await fetch(`https://api.auto.dev/listings?${params}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Auto.dev API HTTP Error! Status: ${response.status}`);
  }

  const result = await response.json();
  if (!result || !Array.isArray(result.data) || result.data.length === 0) {
    return null;
  }

  const prices = result.data
    .map((entry) => entry.retailListing && entry.retailListing.price)
    .filter((price) => typeof price === "number" && price > 0);

  if (prices.length === 0) return null;
  return Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);
}

async function getVehicleValue(vehicleId) {
  const vehicle = await fetchVehicleRow(vehicleId);
  if (!vehicle) return null;

  let value = vehicle.estimatedValue;
  let source = "Database";

  if (value === null) {
    value = await getAutoDevAverage(vehicle);
    if (value === null) return null;
    source = "Auto.dev";
  }

  return {
    value,
    low: Math.round(value * 0.92),
    high: Math.round(value * 1.08),
    updated: new Date().toISOString().slice(0, 10),
    source,
  };
}

const router = express.Router();

router.get("/vehicles/:id/value", async (req, res) => {
  try {
    const data = await getVehicleValue(req.params.id);
    if (!data) return res.status(404).json({ error: "No value found" });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Valuation failed" });
  }
});

module.exports = { router, getVehicleValue };