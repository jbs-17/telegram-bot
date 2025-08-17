import { exec as execOriginal } from "node:child_process";

export function execCommand(command) {
  return new Promise((resolve, reject) => {
    execOriginal(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}
