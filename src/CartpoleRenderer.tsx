/*
 * CartpoleRenderer.tsx
 * Copyright: Microsoft 2019
 *
 * Renders the cart and pole in 3D.
 */

import React, { Component } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";

import { CartpoleModel } from "./CartpoleModel";

interface CartpoleRendererProps {
  theme: "light" | "dark";
  isModelValid: boolean;
  model: CartpoleModel;
}

interface MoabRendererState {}

const zAxis = new THREE.Vector3(0, 0, 1);
const poleRadius = 0.01;
const poleLength = 0.25;
const cartWidth = 0.2;
const cartHeight = 0.02;
const cartDepth = 0.08;
const wheelRadius = 0.045;
const wheelScale = 0.00125;
const poleColor = [0.22, 0.3, 0.38];

export class CartpoleRenderer extends Component<
  CartpoleRendererProps,
  MoabRendererState
> {
  private _container: HTMLDivElement | null = null;
  private _scene?: THREE.Scene;
  private _camera?: THREE.PerspectiveCamera;
  private _renderer?: THREE.WebGLRenderer;
  private _pole?: THREE.Object3D;
  private _cart?: THREE.Object3D;
  private _poleMaterial?: THREE.MeshLambertMaterial;
  private _wheels: THREE.Object3D[] = [];

  constructor(props: CartpoleRendererProps) {
    super(props);

    this.state = {};
  }

  componentDidMount(): void {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    this._renderer = new THREE.WebGLRenderer({ antialias: true });
    this._scene = new THREE.Scene();

    // Create the pole.
    const poleGeom = new THREE.CylinderGeometry(
      poleRadius,
      poleRadius,
      poleLength,
      32
    );
    this._poleMaterial = new THREE.MeshLambertMaterial({});
    this._poleMaterial.color.set(this._getPoleColor());
    const poleMesh = new THREE.Mesh(poleGeom, this._poleMaterial);
    poleMesh.position.y = poleLength / 2;
    this._pole = new THREE.Object3D();
    this._pole.castShadow = true;
    this._pole.add(poleMesh);
    this._scene.add(this._pole);

    const objLoader = new OBJLoader();
    objLoader.load("wheel.obj", (object) => {
      object.scale.set(wheelScale, wheelScale, wheelScale);

      object.traverse((child) => {
        if (child.name === "plastic") {
          const material = (child as THREE.Mesh)
            .material as THREE.MeshStandardMaterial;
          material.color.copy(new THREE.Color("#666666"));
          material.metalness = 1.0;
        }
        if (child.name === "rubber") {
          const material = (child as THREE.Mesh)
            .material as THREE.MeshStandardMaterial;
          material.color.copy(new THREE.Color("#111111"));
        }
      });

      this._cart = new THREE.Object3D();
      this._scene!.add(this._cart);

      const wheelInfo = [
        [cartWidth * 0.3, cartDepth * 0.675],
        [-cartWidth * 0.3, cartDepth * 0.675],
        [cartWidth * 0.3, -cartDepth * 0.675],
        [-cartWidth * 0.3, -cartDepth * 0.675],
      ];

      wheelInfo.forEach((wheelInfo) => {
        const wheel = new THREE.Object3D();
        const clonedObj = object.clone();
        wheel.add(clonedObj);
        wheel.translateX(wheelInfo[0]);
        wheel.translateY(-cartHeight * 0.5);
        wheel.translateZ(wheelInfo[1]);
        this._wheels.push(wheel);
        this._cart!.add(wheel);
      });

      // Create the cart.
      const cartGeom = new THREE.BoxGeometry(cartWidth, cartHeight, cartDepth);
      const cartMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(0.3, 0.3, 0.3),
        reflectivity: 1.0,
        shininess: 150,
      });
      const cartMesh = new THREE.Mesh(cartGeom, cartMaterial);
      this._cart.add(cartMesh);

      // Set up the renderer.
      this._renderer!.setSize(windowWidth, windowHeight);
      this._renderer!.shadowMap.enabled = true;
      this._renderer!.shadowMap.type = THREE.PCFSoftShadowMap;

      // Set up the camera.
      this._camera = new THREE.PerspectiveCamera(
        40,
        windowWidth / windowHeight,
        0.1,
        1000
      );
      this._camera.position.z = 0.5;
      this._camera.position.y = poleLength / 2;
      this._camera.lookAt(0, poleLength / 2 - cartHeight, 0);

      // Set up point lights.
      const locations = [
        [-0.25, poleLength * 2, 0],
        [0.25, poleLength * 2, 0],
      ];
      locations.forEach((loc) => {
        const light = new THREE.PointLight(0xffffff, 0.85, 50, 1.25);
        light.position.set(loc[0], loc[1], loc[2]);
        light.lookAt(0, 0, 0);
        this._scene!.add(light);
      });

      // Set up ambient light.
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
      this._scene!.add(ambientLight);

      // Install handlers
      window.addEventListener("resize", this._onWindowResize, false);

      this._container!.appendChild(this._renderer!.domElement);
    });
  }

  componentWillUnmount(): void {
    // Uninstall handlers.
    window.removeEventListener("resize", this._onWindowResize);
  }

  render(): JSX.Element {
    if (this.props.isModelValid) {
      this._render3DScene();
    }
    return <div ref={(ref) => this._onMount(ref)} />;
  }

  private _getPoleColor(): THREE.Color {
    return new THREE.Color(poleColor[0], poleColor[1], poleColor[2]);
  }

  private _render3DScene(): void {
    if (
      !this._scene ||
      !this._pole ||
      !this._cart ||
      !this._renderer ||
      !this._camera
    ) {
      return;
    }

    const backgroundColor = this.props.theme === "light" ? 0xffffff : 0x1a1a1a;
    this._scene.background = new THREE.Color(backgroundColor);

    // Set pole position based on model. We add a small y value to account
    // for the fact that the base of the pole is flat, so when it starts
    // to fall over, it needs to move up a bit.
    const polePos = new THREE.Vector3(
      this.props.model.state.position,
      Math.sin(Math.abs(this.props.model.state.angle)) * poleRadius,
      0
    );
    this._pole.position.copy(polePos);
    this._pole.setRotationFromAxisAngle(zAxis, -this.props.model.state.angle);

    const cartPos = new THREE.Vector3(
      this.props.model.state.position,
      -cartHeight / 2,
      0
    );
    this._cart.position.copy(cartPos);

    // Rotate the wheels.
    const rotateAngle = -this.props.model.state.position / wheelRadius;
    this._wheels.forEach((wheel) => {
      wheel.setRotationFromAxisAngle(zAxis, rotateAngle);
    });

    // Render scene.
    this._renderer.render(this._scene, this._camera);
  }

  private _onMount = (ref: HTMLDivElement | null) => {
    this._container = ref;
  };

  private _onWindowResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (!this._camera || !this._renderer) {
      return;
    }

    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(width, height);
  };
}
