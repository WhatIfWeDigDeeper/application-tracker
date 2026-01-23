// Type declarations for parse-server module
declare module 'parse-server' {
  import { Application } from 'express';

  export interface ParseServerOptions {
    databaseURI: string;
    appId: string;
    masterKey?: string;
    javascriptKey?: string;
    serverURL: string;
    cloud?: string;
    allowClientClassCreation?: boolean;
    enforcePrivateUsers?: boolean;
    [key: string]: any;
  }

  export class ParseServer {
    constructor(options: ParseServerOptions);
    app: Application;
    start(): Promise<void>;
  }
}
