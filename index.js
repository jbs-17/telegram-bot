// bot-lengkap-esm.js

import { Telegraf, Markup } from 'telegraf';
import axios from 'axios';

import fs from 'fs/promises';
import path from 'node:path';
import { URL } from 'node:url';
import { config } from './config.js';
import { execCommand } from './utils/execCommad.js';

import { DownloadAuto } from './utils/download.js'

const isAndroid = process.platform === 'android';




const commands = `
Command List:\n
 /help       : tampilkan daftar perintah atau pesan ini\n
 /halo       : menyapa dengan nama kamu\n
 /hai        : menyapa dengan nama kamu\n
 /platform   : menunjukan bot platform berjalan: 'android' | 'windows'\n
 /exec       : eksekusi kode dengan satu perintah lengkap dengan argumenya(gunakan pola sesuai contoh). Contoh: /exec "yt-dlp -F https://youtube.com/video/aAiu9dh8&bcs"

`;

// instance bot
const bot = new Telegraf(config.TOKEN);
const download = new DownloadAuto(bot);

// Middleware untuk logging (opsional)
bot.use(async (ctx, next) => {
  console.log(' ');
  if (!ctx.message.chat.type === 'private') {
    return ctx.reply('private only')
  };

  console.log('NEW REQUEST:');
  console.time(`Proses update ${ctx.update.update_id}`);
  await next();
  console.timeEnd(`Proses update ${ctx.update.update_id}`);
});




// Menanggapi semua pesan teks lainnya
bot.on('text', (ctx) => {
  ctx.reply(`perintah:\n"${ctx.text}"\ntidak ada! \n\nsilahkan pakai fitur-fitur yang tersedia 😁`);
});

// Menanggapi perintah /start
bot.start((ctx) => {
  ctx.reply('Silahkan gunakan /help untuk melihat daftar fitur 😉');
});
// Menanggapi perintah /help
bot.help((ctx) => {
  ctx.reply(commands);
});

/* COMMANDS */
// /halo
bot.command('halo', (ctx) => {
  const username = ctx.from.username || ctx.from.first_name + ' ' + ctx.from.last_name;
  ctx.reply(`Hai ${username} 🤗`);
});
// /hai
bot.command('hai', (ctx) => {
  const username = ctx.from.username || ctx.from.first_name + ' ' + ctx.from.last_name;
  ctx.reply(`Halo ${username} 😃`);
});
// platform
bot.command('platform', (ctx) => {
  ctx.reply(process.platform);
});
//exec
bot.command('exec', async (ctx) => {
  const command = ctx.args[0];
  if (`${ctx.message.chat.id}` !== config.ADMIN_ID) return ctx.reply('kamu bukan admin');
  if (!command) return ctx.reply('diperlukan perintah');
  try {
    const exec = await execCommand(command)
    ctx.reply(exec);
  } catch (error) {
    ctx.reply(`gagal menjalankan perintah.\n ERROR: ${error.message || 'internal error'}`);
  }
});






//yt-dlp auto sesuai requested format
bot.command('download_auto', async (ctx) => {
  const url = ctx.args[0];
  if (!url) return ctx.reply('diperlukan url yang valid');
  ctx.reply(`donload sedang diproses dan akan dikirim hasilnya nanti... silahkan menunggu...`);
  download.newDownloadRequest(ctx.message.chat.id, url);
});





const backCameraResult = './storage/camera/0.jpeg';
// Menanggapi perintah kustom /hitung
bot.command('camera', async (ctx) => {
  try {
    if (!isAndroid) {
      return ctx.reply('platform tidak didukung!');
    }
    const args = ctx.message.text.split(' ').slice(1);
    if (args[0] === '0') {
      await execCommand(`termux-camera-photo -c 0 ${backCameraResult}`);
      await ctx.replyWithDocument({ source: backCameraResult });
    }
    ctx.reply('apa coba');
  } catch (error) {
    console.log(error);
    ctx.reply(`maaf, terjadi error\n\n${error.message}`);
  }
});


// Mengirim foto dari URL
bot.command('kirimfoto', (ctx) => {
  const fotoUrl = 'https://picsum.photos/200/300';
  ctx.replyWithPhoto(fotoUrl, { caption: 'Ini foto acak dari internet!' });
});

// Mengirim file dari server
bot.command('kirimfile', (ctx) => {
  const filePath = path.join(path.resolve(), 'storage', 'apalah.jpg');
  if (fs.existsSync(filePath)) {
    ctx.replyWithDocument({ source: filePath });
  } else {
    ctx.reply('Maaf, file tidak ditemukan di server.');
  }
});

// --- Markup Keyboard ---
bot.command('pilihan', (ctx) => {
  ctx.reply('Pilih salah satu:', Markup
    .keyboard([
      ['Pilihan 1', 'Pilihan 2'],
      ['Batal']
    ])
    .resize()
    .oneTime()
  );
});

// Menanggapi teks dari tombol keyboard
bot.hears('Pilihan 1', (ctx) => ctx.reply('Anda memilih Pilihan 1!'));
bot.hears('Pilihan 2', (ctx) => ctx.reply('Anda memilih Pilihan 2!'));
bot.hears('Batal', (ctx) => ctx.reply('Pilihan dibatalkan.', Markup.removeKeyboard()));




// --- Markup Inline Keyboard ---
bot.command('inline', (ctx) => {
  ctx.reply('Apakah Anda suka bot ini?', Markup.inlineKeyboard([
    Markup.button.callback('👍 Ya, suka!', 'suka'),
    Markup.button.callback('👎 Tidak suka', 'tidak_suka')
  ]));
});

// Menanggapi klik tombol inline
bot.action('suka', (ctx) => {
  ctx.reply('Terima kasih atas tanggapan positif Anda!');
  ctx.answerCbQuery();
});

bot.action('tidak_suka', (ctx) => {
  ctx.reply('Maaf, kami akan terus meningkatkan layanan kami.');
  ctx.answerCbQuery();
});

// --- Menerima File dari Pengguna ---

// Mendengarkan pesan foto
bot.on('photo', async (ctx) => {
  const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
  const fileLink = await bot.telegram.getFileLink(fileId);
  const fileName = `${fileId}.jpg`;
  const filePath = path.join(path.resolve(), 'storage', fileName);

  try {
    const response = await axios({
      url: fileLink.href,
      responseType: 'stream'
    });
    response.data.pipe(fs.createWriteStream(filePath));
    ctx.reply('Foto berhasil disimpan!');
    console.log(`Foto disimpan di: ${filePath}`);
  } catch (error) {
    console.error('Gagal mengunduh foto:', error);
    ctx.reply('Maaf, gagal menyimpan foto.');
  }
});

// Mendengarkan pesan dokumen (file non-foto)
bot.on('document', async (ctx) => {
  const fileId = ctx.message.document.file_id;
  const fileLink = await bot.telegram.getFileLink(fileId);
  const fileName = ctx.message.document.file_name || `${fileId}`;
  const filePath = path.join(path.resolve(), 'storage', fileName);

  try {
    const response = await axios({
      url: fileLink.href,
      responseType: 'stream'
    });
    response.data.pipe(fs.createWriteStream(filePath));
    ctx.reply(`Dokumen "${fileName}" berhasil disimpan!`);
    console.log(`Dokumen disimpan di: ${filePath}`);
  } catch (error) {
    console.error('Gagal mengunduh dokumen:', error);
    ctx.reply('Maaf, gagal menyimpan dokumen.');
  }
});




// Jalankan bot
let running = false;
while (!running) {
  try {
    await bot.launch();
    running = true;
  } catch (error) {
    console.log(error);
    running = false;
  }
}


console.log('Bot Telegraf sedang berjalan...');
// Menangkap sinyal berhenti (misalnya Ctrl+C) untuk menutup bot dengan rapi
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

process.on('uncaughtException', (error) => {
  console.log(error);
}) 