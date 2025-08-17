// bot-lengkap-esm.js

import { Telegraf, Markup } from 'telegraf';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import {execCommand} from './utils/execCommad.js';



// Ganti dengan token bot Anda
const token = '8228908836:AAGrSiqDkGcm_puNuB9Qr9xLH0P5yB9p2zE';

// Buat instance bot
const bot = new Telegraf(token);

// Middleware untuk logging (opsional)
bot.use(async (ctx, next) => {
  console.time(`Proses update ${ctx.update.update_id}`);
  await next();
  console.timeEnd(`Proses update ${ctx.update.update_id}`);
});

// Menanggapi perintah /start
bot.start((ctx) => {
  ctx.reply('Selamat datang! Ada yang bisa saya bantu? Silakan gunakan /help untuk melihat fitur.');
});

// Menanggapi perintah /help
bot.help((ctx) => {
  ctx.reply('Berikut beberapa perintah yang bisa Anda gunakan:\n' +
    '/start - Memulai bot\n' +
    '/help - Menampilkan daftar perintah\n' +
    '/halo - Menyapa kembali Anda\n' +
    '/hitung [angka] [operator] [angka] - Contoh: /hitung 10 + 5\n' +
    '/pilihan - Menampilkan keyboard pilihan\n' +
    '/inline - Menampilkan tombol inline\n' +
    '/kirimfoto - Mengirim foto dari URL\n' +
    '/kirimfile - Mengirim file dari server\n\n' +
    'Anda juga bisa mengirim saya foto atau file untuk saya simpan.');
});

// Menanggapi perintah kustom /halo
bot.command('halo', (ctx) => {
  const username = ctx.from.username || ctx.from.first_name;
  ctx.reply(`Hai ${username}, saya siap membantu!`);
});

// Menanggapi perintah kustom /hitung
bot.command('hitung', (ctx) => {
  try {
    const args = ctx.message.text.split(' ').slice(1);
    const hasil = eval(args.join(' ')); // HATI-HATI: eval() tidak aman untuk input dari pengguna
    ctx.reply(`Hasil dari ${args.join(' ')} adalah: ${hasil}`);
  } catch (error) {
    ctx.reply('Format perhitungan salah. Contoh: /hitung 10 + 5');
  }
});
// Menanggapi perintah kustom /hitung
bot.command('hitung', (ctx) => {
  try {
    const args = ctx.message.text.split(' ').slice(1);
    const hasil = eval(args.join(' ')); // HATI-HATI: eval() tidak aman untuk input dari pengguna
    ctx.reply(`Hasil dari ${args.join(' ')} adalah: ${hasil}`);
  } catch (error) {
    ctx.reply('Format perhitungan salah. Contoh: /hitung 10 + 5');
  }
});


const backCameraResult = './storage/camera/0.jpeg'
// Menanggapi perintah kustom /hitung
bot.command('camera',async (ctx) => {
  try {
    const args = ctx.message.text.split(' ').slice(1);
    if(args[0] === '0'){
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

// Menanggapi semua pesan teks lainnya
bot.on('text', (ctx) => {
  ctx.reply('Saya tidak mengerti perintah ini. Coba /help untuk daftar perintah.');
});

// Jalankan bot
bot.launch();

console.log('Bot Telegraf sedang berjalan...');

// Menangkap sinyal berhenti (misalnya Ctrl+C) untuk menutup bot dengan rapi
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));