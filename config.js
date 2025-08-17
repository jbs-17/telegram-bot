import dotenv from "dotenv";
dotenv.configDotenv();
export const config = {};
config.TOKEN = process.env.TOKEN;
config.ADMIN_ID = process.env.ADMIN_ID;

console.log(config);