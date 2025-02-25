import React, { useState, useEffect } from "react";
import mqtt from "mqtt";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// MQTT & API Configuration
const MQTT_BROKER =
  "wss://97a5a91b9b2f48f5a697c8c74a2844b4.s1.eu.hivemq.cloud:8884/mqtt";
const MQTT_TOPIC_TEMP = "sensor/temperature";

const API_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=23.064258&longitude=72.677175&current_weather=true";

const MqttDashboard = () => {
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sensorData, setSensorData] = useState([]);
  const [temperature, setTemperature] = useState({ time: "", temperature: 0 });

  // Function to get current time in HH:MM:SS format
  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString();
  };

  // Fetch temperature from API and add random variations
  const fetchTemperature = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      let temp = data.current_weather.temperature;

      // Add a random variation of ±0.5°C
      const variation = (Math.random() * 1 - 0.5).toFixed(1);
      temp = (parseFloat(temp) + parseFloat(variation)).toFixed(1);

      console.log(`🌡 New Temp: ${temp}°C at ${getCurrentTime()}`);

      setTemperature({ time: getCurrentTime(), temperature: temp });
    } catch (error) {
      console.error("❌ Error fetching temperature:", error);
    }
  };

  useEffect(() => {
    // MQTT Connection Options
    const options = {
      username: "Mahipal",
      password: "Mahipal@123",
    };

    // Connect to HiveMQ
    const mqttClient = mqtt.connect(MQTT_BROKER, options);

    mqttClient.on("connect", () => {
      console.log("✅ Connected to HiveMQ broker");
      setIsConnected(true);
      mqttClient.subscribe(MQTT_TOPIC_TEMP, { qos: 1 });
    });

    mqttClient.on("message", (topic, payload) => {
      const message = payload.toString();
      console.log(
        `📩 Received: ${topic} → ${message}°C at ${getCurrentTime()}`
      );

      setSensorData((prevData) => [
        ...prevData.slice(-10), // Keep only last 10 records
        {
          time: getCurrentTime(), // Timestamp
          temperature: parseFloat(message),
        },
      ]);
    });

    mqttClient.on("error", (err) => console.error("❌ MQTT Error:", err));
      mqttClient.on("close", () => {
        console.log("🔴 Disconnected. Attempting to reconnect...");
        setIsConnected(false);
      });

    setClient(mqttClient);

    return () => {
      mqttClient.end(); // Clean up connection
    };
  }, []);

  // Fetch temperature every 5 seconds & publish to MQTT
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTemperature();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Publish temperature data to MQTT
  useEffect(() => {
    if (client && isConnected && temperature.temperature > 0) {
      console.log(
        `📤 Publishing Temperature: ${temperature.temperature}°C at ${temperature.time}`
      );
      client.publish(MQTT_TOPIC_TEMP, temperature.temperature.toString(), {
        qos: 1,
        retain: true,
      });
    }
  }, [temperature]);

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>📡 MQTT Dashboard - HiveMQ</h2>
      <p>
        Status:{" "}
        <strong>{isConnected ? "🟢 Connected" : "🔴 Disconnected"}</strong>
      </p>

      {/* Chart for real-time temperature data */}
      <h3>📊 Temperature Data Visualization</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={sensorData}
          margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            label={{ value: "Time (HH:MM:SS)", position: "bottom", dy: 10 }}
          />
          <YAxis
            domain={[20, 40]}
            tickCount={10}
          />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#FF5733"
            name="Temperature (°C)"
          />
        </LineChart>  
      </ResponsiveContainer>

      {/* Display raw received messages */}
      <h3>📥 Received MQTT Messages</h3>
      <ul className="flex">
        {sensorData.map((entry, index) => (
          <li key={index}>
            ⏰ {entry.time} → 🌡 Temp: {entry.temperature}°C
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MqttDashboard;
