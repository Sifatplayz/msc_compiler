import { world } from "@minecraft/server";
import Log from "../utilities/Log";
import type { ObjectStruct } from "../utilities/typedef";
import { TypeParser } from "./TypeParser";

async function ParseData(
  object: any,
  cd: string,
  cv: any,
  type: string
): Promise<void> {
  switch (cd) {
    case "Namespace":
      if (typeof cv !== "string") {
        Log.error(
          `<Namespace> type string expected instead found ${typeof cv}`
        );
        return;
      }
      object.Data[
        "minecraft:block"
      ].description.Identifier = `${cv}:${object.name.toLowerCase()}`;
      break;
    case "Version":
      if (!Array.isArray(cv) || cv.length !== 3) {
        Log.error(
          `<Version> type array with length 3 expected instead found ${typeof cv}`
        );
        return;
      }
      object.Data.format_version = cv.join(".");
      break;
    case "Identifier":
      if (typeof cv !== "string") {
        Log.error(
          `<Identifier> type string expected instead found ${typeof cv}`
        );
        return;
      }
      const identifier: string =
        object.Data[`minecraft:${type.toLowerCase()}`].description.identifier;
      const parts: string[] = identifier.split(":");
      parts[1] = cv.toLowerCase();
      object.Data[`minecraft:${type.toLowerCase()}`].description.identifier =
        parts.join(":");
      break;

    case "IsHiddenInCommands":
      if (typeof cv != "boolean") {
        Log.error(
          `<IsHiddenInCommands> type boolean expected instead found ${typeof cv}`
        );
        return;
      }

      break;

    case "Group":

      break;

    case "Category":  
      break;
    default:
      Log.error(`Unknown component data type: ${cd}`);
      break;
  }
}

async function ParseComponent(
  object: ObjectStruct,
  type: string
): Promise<ObjectStruct | undefined> {
  let parsedComponentData: any = {};
  let component: any;
  if (["block", "item", "entity", "recipe"].includes(type)) {
    component = await import(`./components/${type}.json`);
  } else {
    Log.error(`Unknown component type: ${type}`);
    return;
  }

  for (const [cd, cv] of Object.entries(object)) {
    if (["reset", "init", "Data", "Component"].includes(cd)) continue;
    if (["Namespace", "Version", "Identifier"].includes(cd)) {
      await ParseData(object, cd, cv, type).catch((error) => {
        Log.error(`Error parsing ${cd}: ${error.message}`);
      });
    }
    const compInfo: any[] = component[cd];
    const cdLen = compInfo.length;
    for (let i = 0; i < cdLen; i++) {
      const mobj: any = compInfo[i];
      const { type } = mobj;
      if (typeof cv != type) {
        if (mobj.type === "array" && Array.isArray(cv)) {
          TypeParser.ParseArray(cv, mobj, parsedComponentData, object);
        } else {
          if (cdLen > 1 && compInfo.indexOf(mobj) != cdLen - 1) continue;
          Log.error(
            `<${object.name}> expected value of ${cd} to be type ${type}`
          );
          return;
        }
      } else {
        if (type === "object") {
          TypeParser.ParseObject(cv, mobj, parsedComponentData, object);
        }
        // Handle numbers
        // TypeParser.ParseValues(cv,mobj,object,parsedComponentData)
        if (typeof cv === "number") {
          parsedComponentData[mobj.name] = TypeParser.ParseNums(
            cv,
            mobj,
            object
          );
        }
      }
      if (mobj.default !== undefined && !parsedComponentData[mobj.name]) {
        parsedComponentData[mobj.name] = mobj.default;
        Log.warn(`<${object.name}> using default value for ${mobj.name}`);
      }
    }
  }
  return parsedComponentData;
}

export { ParseComponent };
