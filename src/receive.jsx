import React, { useState, useEffect } from "react";
import mqtt from "mqtt";

// Update with your HiveMQ details
const MQTT_BROKER = "wss://97a5a91b9b2f48f5a697c8c74a2844b4.s1.eu.hivemq.cloud:8884/mqtt";
const MQTT_TOPIC = "test/topic"; // Change to your desired topic

const Receive = () => {
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Connect to HiveMQ MQTT broker
    const options = {
      username: "Mahipal",  // Replace with HiveMQ credentials
      password: "Mahipal@123",  // Replace with HiveMQ credentials
      reconnectPeriod: 1000,
    };

    const mqttClient = mqtt.connect(MQTT_BROKER, options);

    mqttClient.on("connect", () => {
      console.log("🟢 Connected to HiveMQ broker");
      setIsConnected(true);

      // Subscribe to topic
      mqttClient.subscribe(MQTT_TOPIC, (err) => {
        if (!err) {
          console.log(`🟢 Subscribed to topic: ${MQTT_TOPIC}`);
        }
      });
    });

    // Receive messages
    mqttClient.on("message", (topic, payload) => {
      setMessages((prevMessages) => [...prevMessages, payload.toString()]);
    });

    mqttClient.on("error", (err) => {
      console.error("🛑 MQTT Error:", err);
    });

    setClient(mqttClient);

    return () => {
      mqttClient.end(); // Clean up connection on unmount
    };
  }, []);

  // Publish a message
  const sendMessage = () => {
    if (client && isConnected && message) {
      client.publish(MQTT_TOPIC, message);
      setMessage("");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>MQTT React App - HiveMQ</h2>
      <p>Status: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}</p>

      {/* Input field for sending messages */}
      <div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter message"
          autoFocus
        />
        <button onClick={sendMessage}>Send</button>
      </div>

      {/* Display received messages */}
      <h3>Received Messages:</h3>
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>{msg}</li>
        ))}
      </ul>
    </div>
  );
};

export default Receive;
