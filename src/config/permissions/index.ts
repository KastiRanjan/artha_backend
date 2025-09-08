import { ModulesPayloadInterface } from "../permission-config";
import { businessSizePermissions } from "./business-size-permissions";
import { businessNaturePermissions } from "./business-nature-permissions";

// This file exports all custom permissions for easy import into the main permission-config file
export const customModules: ModulesPayloadInterface[] = [
  businessSizePermissions,
  businessNaturePermissions
];
