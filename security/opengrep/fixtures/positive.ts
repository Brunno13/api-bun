declare const input: string;
declare const crypto: any;

import * as childProcess from "node:child_process";

eval(input);

new Function(input);

childProcess.exec(input);
childProcess.execSync(input);

crypto.createHash("md5");
crypto.createHash("sha1");

const insecureTlsOptions = {
  rejectUnauthorized: false,
};