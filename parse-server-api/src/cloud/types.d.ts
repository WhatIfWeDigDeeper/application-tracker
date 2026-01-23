// Type definitions for Parse Cloud Code
// Parse is available as a global in cloud functions

import * as ParseType from 'parse/node';

declare global {
  namespace Parse {
    export const Cloud: typeof ParseType.Cloud;
    export const Query: typeof ParseType.Query;
    export const Object: typeof ParseType.Object;
    export const Error: typeof ParseType.Error;
    export const Schema: typeof ParseType.Schema;

    // Type aliases for Parse.Object instances
    export type Object<T = any> = ParseType.Object<T>;

    // Cloud function request types
    export namespace Cloud {
      export interface BeforeSaveRequest<T = any> {
        object: ParseType.Object<T>;
        user?: ParseType.User;
        master: boolean;
        installationId?: string;
        ip?: string;
        headers?: { [key: string]: string };
        triggerName: string;
        log: any;
        original?: ParseType.Object<T>;
      }

      export interface AfterDeleteRequest<T = any> {
        object: ParseType.Object<T>;
        user?: ParseType.User;
        master: boolean;
        installationId?: string;
        ip?: string;
        headers?: { [key: string]: string };
        triggerName: string;
        log: any;
      }

      export interface FunctionRequest<T = any> {
        params: T;
        user?: ParseType.User;
        master: boolean;
        installationId?: string;
        ip?: string;
        headers?: { [key: string]: string };
        functionName: string;
        log: any;
      }
    }
  }
}

export {};
