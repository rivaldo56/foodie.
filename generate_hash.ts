import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const code = "#120021m";
const salt = await bcrypt.genSalt(10);
const hash = await bcrypt.hash(code, salt);

console.log(`Hash for '${code}': ${hash}`);
