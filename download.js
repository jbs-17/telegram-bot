import pkg from 'jsonfile';
const { readFile, writeFile } = pkg;


export const downloadList = await readFile('./storage/download.json');
console.log(downloadList);
if (downloadList.length) {
  for await (const element of downloadList) {

  }
}


export async function startDownload(id, url) {
  try {
    await writeFile((await readFile('./storage/download.json')).push('./storage/download.json',{ id, url }));
  } catch (error) {
    console.log(error);
  }
}