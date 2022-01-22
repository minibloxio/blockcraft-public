import { Object3D, Vector3, Quaternion, Euler } from "three";

export class Keyframe {
  position: Vector3;
  rotation: Quaternion;
  duration: number;

  constructor(position?: Vector3, rotation?: Quaternion | Euler, duration = 1) {
    this.position = position;
    this.rotation = rotation instanceof Euler ? new Quaternion().setFromEuler(rotation) : rotation;
    this.duration = duration;
  }
}

// animate in a loop between all keyframes
export class AnimationLerp {
  totalTime = 0;
  keyFrames: Keyframe[];
  cumulativeTime = new Array<number>();
  obj: Object3D;

  constructor(keyframes: Keyframe[], obj: Object3D) {
    this.keyFrames = keyframes;
    this.obj = obj;
    for (const keyframe of keyframes) {
      this.cumulativeTime.push(this.totalTime);
      this.totalTime += keyframe.duration;
    }
  }

  /**
   * Update the animation
   *
   * @param alpha a number between 0 and 1 representing the progress of the animation
   */
  update(alpha: number) {
    let progress = alpha * this.totalTime;
    let begin = 0;

    for (; begin < this.keyFrames.length; begin++) {
      const duration = this.keyFrames[begin].duration;
      if (progress <= duration) {
        break;
      }
      progress -= duration;
    }

    const end = begin + 1 >= this.keyFrames.length ? 0 : begin + 1;
    const kfa = this.keyFrames[begin];
    const kfb = this.keyFrames[end];
    const kfAlpha = progress / kfa.duration;
    this.obj.position.lerpVectors(kfa.position, kfb.position, kfAlpha);
    this.obj.quaternion.slerpQuaternions(kfa.rotation, kfb.rotation, kfAlpha);
  }
}
