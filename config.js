import dotenv from "dotenv";
import path from 'node:path';
dotenv.configDotenv();
export const config = {};
config.TOKEN = process.env.TOKEN;
config.ADMIN_ID = process.env.ADMIN_ID;
config.TMP = './storage/tmp';
console.log(config);