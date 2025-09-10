import { ModulesPayloadInterface } from "../../config/permission-config";
import { businessSizePermissions } from "./business-size-permissions";
import { businessNaturePermissions } from "./business-nature-permissions";
import { legalStatusPermissions } from "./legal-status-permissions";
import { portalCredentialsPermissions } from "./portal-credentials-permissions";

// This file exports all custom permissions for easy import into the main permission-config file
export const customModules: ModulesPayloadInterface[] = [
  businessSizePermissions,
  businessNaturePermissions,
  legalStatusPermissions,
  portalCredentialsPermissions
];
