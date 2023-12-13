const {BlockRegistry} = require("../src/assets/Registries/BlockRegistry")
const {Block} = require("../src/assets/Block")
const {Permutation} = require("../src/assets/Permutation")
const {Fluid} = require("../src/assets/Fluid")
const { FluidRegistry } = require("../src/assets/Registries/FluidRegistry")

class LogRotation0 extends Permutation {
  static Transformation = {
    Rotation: [0, 0, 0]
  }
}
class LogRotation1 extends Permutation {
  static Transformation = {
    Rotation: [90, 0, 0]
  }
}
class LogRotation2 extends Permutation {
  static Transformation = {
    Rotation: [0, 90, 0]
  }
}

class DestroyTime extends Permutation {
  static DestroyTime = 6
}
class PalmLog extends Block {
    static States = {
        "prop":[1,2,3]
    }
  static DisplayName = "Palm Log"
  static Material = {
    "*": {
      Texture: "palm_log"
    }
  }
  static Category = "construction"
  static Permutations = {
    "prop==1": DestroyTime.init(),
    "prop == 2": DestroyTime.init()
  }
}

BlockRegistry.register(PalmLog)

/**
 * @class Log
 */
class Log extends Block {
  static Category = "construction";
  static DisplayName = "Log";
  static DestroyTime = 6;
  static ExplosionResistance = 5;
  static Flammable = {
    CatchChanceModifier: 20,
    DestroyChanceModifier: 40
  }
  static OnPlayerPlacing = {
    Event: "rotate",
    Target: "self",
    Action: {
      SetBlockState: {
        "rotation": "Math.floor(q.cardinal_face/2)"
      }
    }
  }
  static States = {
    "rotation": [0,1,2]
  }
  static Permutations = {
    "rotation ==0": LogRotation0.init(),
    "rotation ==1": LogRotation1.init(),
    "rotation ==2": LogRotation2.init()
  }
}

BlockRegistry.register(Log)


class Blocky extends Block {
  static DisplayName = 'This is a block'
}

class Water extends Fluid {
  static SwimSpeed =3;
  
}
BlockRegistry.register(Blocky)
FluidRegistry.register(Water)
