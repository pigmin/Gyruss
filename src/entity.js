import { TransformNode, Vector3 } from "@babylonjs/core";


export class Entity {

  x = 0;
  y = 0;
  z = 0;
  prevX = 0;
  prevY = 0;
  prevZ = 0;

  vx = 0;
  vy = 0;
  vz = 0;

  ax = 0;
  ay = 0;
  az = 0;

  transform;
  gameObject;

  constructor(x, y, z) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
    this.transform = new TransformNode();
    this.transform.position = new Vector3(this.x, this.y, this.z);
  }

  init(gameObject) {
    this.gameObject = gameObject;
    this.gameObject.setParent(this.transform);
  }

  setPosition(x, y, z) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
    this.updatePosition();
  }

  updatePosition() {
    this.transform.position.set(this.x, this.y, this.z);
  }

  applyVelocities(factor) {
    this.prevX = this.x;
    this.prevY = this.y;
    this.prevZ = this.z;

    factor = factor || 1;

    this.x = this.x + (this.vx * factor);
    this.y = this.y + (this.vy * factor);
    this.z = this.z + (this.vz * factor);

  }

  //Called on first frame
  start() {

  }

  update(deltaTime) {

  }

  render() {

  }

}

export default Entity;