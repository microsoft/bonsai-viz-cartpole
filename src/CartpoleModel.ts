/*
* CartpoleModel.ts
* Copyright: Microsoft 2019
*
* Data model for cartpole simulator.
*/

export interface CartpoleState {
    position: number;
    velocity: number;
    angle: number;
}

export interface CartpoleModel {
    state: CartpoleState;
}
