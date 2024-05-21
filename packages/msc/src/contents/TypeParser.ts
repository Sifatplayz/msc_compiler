import Log from "../utilities/Log";
import {
  checkProperties,
  isType,
  getArrayType,
  isInt,
  isFloat,
} from "../utilities/Utils";
import type { ObjectStruct } from "../types";
import Emsg from "../utilities/Emsg";

export namespace TypeParser {
  export function ParseObject(
    cv: any,
    mobj: any,
    parsedComponentData: any,
    object: ObjectStruct
  ): void {
    const cvLen = Object.keys(cv).length;
    const mobjProperties = mobj.properties;
    const mobjPropertyNames = mobjProperties.map((obj) => obj.name);
    // TODO: Correct Later
    if (mobjPropertyNames.some((name: string) => name.startsWith("$")))
      TypeParser.ParseTemplateLiteral(cv, mobj, parsedComponentData, object);
    const unknownProperties = checkProperties(cv, mobjPropertyNames);
    if (unknownProperties.length > 0) {
      Log.error(
        `<${object.name}> contains unknown properties: ${unknownProperties.join(
          ", "
        )}`
      );
    }
    if (mobjProperties.length > cvLen) {
      Log.error(`Mismatch in properties for <${object.name}>`);
      return;
    }
    mobjProperties.forEach((property: ObjectStruct) => {
      const { type, name, default: defaultValue, alias } = property;
      const propertyValue = cv[alias];
      if (propertyValue !== undefined) {
        if (typeof propertyValue !== type) {
          if (type === "array" && Array.isArray(propertyValue)) {
            TypeParser.ParseArray(
              propertyValue,
              property,
              parsedComponentData[mobj.name][name],
              object
            );
          } else {
            Emsg.typeError
            Log.error(`<${object.name}> expected ${alias} to be type ${type}`);
          }
          return;
        }

        if (type === "object") {
          TypeParser.ParseObject(
            propertyValue,
            property,
            parsedComponentData[mobj.name][name],
            object
          );
        }

        parsedComponentData[mobj.name][name] = propertyValue;
      } else {
        if (defaultValue === undefined) {
          Log.error(
            `<${object.name}> expected ${alias} to have a value with the type ${type}`
          );
          return;
        }
        parsedComponentData[mobj.name][name] = defaultValue;
      }
    });
  }

  export function ParseArray(
    cv: any[],
    mobj: any,
    parsedComponentData: any,
    object: ObjectStruct
  ): void {
    const { maxItems, type, name, items } = mobj.items;
    if (!Array.isArray(cv)) {
      Log.error(`<${object.name}> expected array for value of ${name}`);
      return;
    }
    if (
      maxItems !== undefined &&
      (cv.length >= maxItems)
    ) {
      Log.error(
        `<${object.name}> expected array length of ${maxItems}, instead got ${cv.length}`
      );
      return;
    }
    if (!isType(cv, type)) {
      Log.error(
        `<${object.name
        }> expected array elements to be type ${type}[], instead got ${getArrayType(
          cv
        )}[]`
      );
      return;
    } else {
      switch (type) {
        case "object":
          cv.map((element) =>
            TypeParser.ParseObject(element, items, parsedComponentData, object)
          );
          parsedComponentData[name] = cv;
          break;

        case "array":
          TypeParser.ParseArray(cv, items.items, parsedComponentData, object);
          break;
        case "int":
        case "float":
          cv.forEach((element, index) => {
            const parsedValue = TypeParser.ParseNums(element, { type }, object);
            parsedComponentData[name][index] = parsedValue;
          });
          break;

        default:
          Log.error(`<${object.name}> unsupported array type: ${type}`);
          return;
      }
    }
  }

  export function ParseNums(
    cv: number,
    mobj: any,
    object: any
  ): number | undefined {
    const { type } = mobj;

    switch (type) {
      case "int":
        if (!isInt(cv)) {
          Log.warn(
            `<${object.name}> expected value to be type ${type}, instead got float`
          );
          // Convert float to int
          return Math.round(cv);
        }
        return cv;
      case "float":
        if (!isFloat(cv)) {
          Log.warn(
            `<${object.name}> expected value to be type ${type}, instead got int`
          );
          // Convert int to float
          return parseFloat((cv as number).toFixed(10));
        }
        return cv;
      default:
        Log.error(`<${object.name}> unsupported numeric type: ${type}`);
        break;
    }
  }

  export function ParseTemplateLiteral(cv, mobj, parsedComponentData, object) { }
}

function resolveAlias(alias: string, cv: any): any {
  if (alias.startsWith("$UPPER_CASE(") && alias.endsWith(")")) {
    const propertyName = alias.substring(12, alias.length - 1);
    const propertyValue = cv[propertyName];
    if (typeof propertyValue === "string") {
      return propertyValue;
    } else {
      return null;
    }
  }
  return null;
}
