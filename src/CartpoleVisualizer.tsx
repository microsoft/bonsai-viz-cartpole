/*
 * CartpoleVisualizer.tsx
 * Copyright: Microsoft 2019
 *
 * Visualizer app for the cartpole simulator.
 */

import {
  CompatibleVersion,
  IterationUpdateMessage,
  MessageType,
  QueryParams,
  ThemeMode,
} from "microsoft-bonsai-visualizer";
import React, { Component } from "react";
import * as semver from "semver";

import { CartpoleModel } from "./CartpoleModel";
import { CartpoleRenderer } from "./CartpoleRenderer";

interface CartpoleVisualizerProps {}

interface CartpoleVisualizerState {
  theme: ThemeMode;
  isModelValid: boolean;
  model: CartpoleModel;
}

export default class CartpoleVisualizer extends Component<
  CartpoleVisualizerProps,
  CartpoleVisualizerState
> {
  constructor(props: CartpoleVisualizerProps) {
    super(props);

    const queryParams = new URLSearchParams(window.location.search);
    const initialTheme = this._getInitialTheme(queryParams);

    this.state = {
      theme: initialTheme,
      isModelValid: true,
      model: {
        state: {
          position: 0,
          velocity: 0,
          angle: 0,
        },
      },
    };
  }

  componentDidMount(): void {
    window.addEventListener("message", this._receiveMessage);
  }

  componentWillUnmount(): void {
    window.removeEventListener("message", this._receiveMessage);
  }

  render(): JSX.Element {
    return (
      <CartpoleRenderer
        theme={this.state.theme}
        isModelValid={this.state.isModelValid}
        model={this.state.model}
      />
    );
  }

  private _receiveMessage = (evt: Event) => {
    if (evt.type !== "message") {
      return;
    }

    const messageStr = (evt as any).data;
    if (typeof messageStr !== "string") return;

    let message: IterationUpdateMessage;
    try {
      message = JSON.parse(messageStr);
    } catch (err) {
      return;
    }
    if (!semver.satisfies(message.version, CompatibleVersion)) {
      return;
    }
    if (message.type !== MessageType.IterationUpdate) {
      return;
    }

    let newState: CartpoleVisualizerState;

    // Old cartpole sim?
    const state = message.state as { [key: string]: any };
    if (state["position"] !== undefined) {
      newState = {
        theme: this.state.theme,
        isModelValid: true,
        model: {
          state: {
            position: state["position"],
            velocity: state["velocity"],
            angle: state["angle"],
          },
        },
      };
      // Less old cartpole sim
    } else if (state["x"] !== undefined) {
      newState = {
        theme: this.state.theme,
        isModelValid: true,
        model: {
          state: {
            position: state["x"],
            velocity: state["x_dot"],
            angle: state["theta"],
          },
        },
      };
      // Newest cartpole sim
    } else {
      newState = {
        theme: this.state.theme,
        isModelValid: true,
        model: {
          state: {
            position: state["cart_position"],
            velocity: state["cart_velocity"],
            angle: state["pole_angle"],
          },
        },
      };
    }

    this.setState(newState);
  };

  private _getInitialTheme(queryParams: URLSearchParams): ThemeMode {
    const theme = queryParams.get(QueryParams.Theme);
    return theme === ThemeMode.Dark ? ThemeMode.Dark : ThemeMode.Light;
  }
}
