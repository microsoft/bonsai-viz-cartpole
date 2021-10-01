/*
 * index.tsx
 * Copyright: Microsoft 2019
 *
 * Main page for cartpole simulator visualizer.
 */

import "./index.css";

import React from "react";
import ReactDOM from "react-dom";

import CartpoleVisualizer from "./CartpoleVisualizer";

ReactDOM.render(<CartpoleVisualizer />, document.getElementById("root"));
