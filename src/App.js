import React from "react";
import MqttComponent from "./mqttService";
import Receive from "./receive";

function App() {
  return (
    <div>
      <h1>React MQTT Client</h1>
      {/* <MqttComponent /> */}
      <Receive />
    </div>
  );
}

export default App;
