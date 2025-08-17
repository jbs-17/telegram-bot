import pkg from 'jsonfile';
import {
  EventEmitter
} from 'node:events';
import {
  promisify
} from 'node:util';
import {
  execCommand
} from './execCommad.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  randomUUID
} from 'node:crypto';
import {
  Telegraf
} from 'telegraf';
const readFile = promisify(pkg.readFile);
const writeFile = promisify(pkg.writeFile);


export const downloadList = await readFile('./storage/download.json');
export class DownloadAuto extends EventEmitter {
  constructor(bot = new Telegraf) {
    super();
    this.init();
    this.bot = bot;
  }

  async init() {
    this.downloadList = await readFile('./storage/download.json');
    for await (const request of downloadList) {
      this.runDownload(request);
    }
  }

  async newDownloadRequest(id, url) {
    const uuid = randomUUID();
    const request = {
      uuid,
      id,
      url,
      source: ' '
    };
    this.downloadList = await readFile('./storage/download.json');
    this.downloadList.push(request);
    await writeFile('./storage/download.json', this.downloadList);
    this.runDownload(request);
  }

  async runDownload( {
    uuid, id, url, source = ''
  }) {
    try {
      source = `./storage/tmp/${uuid}_%(title)s.%(ext)s`;
      await execCommand(`yt-dlp -o "${source}" "${url}"`);
      source = (await fs.readdir('./storage/tmp/')).filter(f => f.includes(uuid))[0];
      source = path.join('./storage/tmp/', source);
      await this.send({
        uuid, id, url, source
      });
      await fs.unlink(source);
      await this.removeDownloadRequest({
        uuid, id, url, source
      });
    } catch (error) {
      
      await this.removeDownloadRequest({
        uuid
      });
      fs.writeFile(source, '');
      await fs.unlink(source);
      await this.bot.telegram.sendMessage(id, `gagal mendonwload\n${url}\n\n${error.message}`);
    }
  }

  async removeDownloadRequest( {
    uuid
  }) {
    const filtered = this.downloadList.filter(r => r.uuid !== uuid);
    console.log({
      filtered
    });
    await writeFile('./storage/download.json', filtered);
  }

  async send( {
    uuid, id, url, source
  }) {
    try {
      await this.bot.telegram.sendDocument(id, {
        source
      });
    } catch (error) {
      await fs.writeFile(source, '');
      await fs.unlink(source);
      await this.removeDownloadRequest(request);
      await this.bot.telegram.sendMessage(id, `gagal mendonwload\n${url}\n\n${error.message}`);
    }
  }

}