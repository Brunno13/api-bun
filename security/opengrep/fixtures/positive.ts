declare const input: string;
declare const runner: any;
declare const crypto: any;

eval(input);

new Function(input);

runner.exec(input);
runner.execSync(input);

crypto.createHash("md5");
crypto.createHash("sha1");

const insecureTlsOptions = {
  rejectUnauthorized: false,
};
