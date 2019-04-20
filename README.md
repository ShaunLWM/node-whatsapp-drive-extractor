# node-whatsapp-drive-extractor

[![MIT license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/ShaunLWM/node-whatsapp-drive-extractor/blob/master/LICENSE)

Download your synced WhatsApp medias from Google Drive backup

## Requirement
- NodeJS v8 and above

## Instructions
1. Clone the repository using "git clone xxx" or download  [master zip](https://github.com/ShaunLWM/node-whatsapp-drive-extractor/archive/master.zip)
2.  `yarn install`
3. Rename `config-sample.js` to `config.js` and fill in required details `gmail,passw & celnumbr`.
4. Run `npm start` or `node index.js`.

## Todo
- commandline version
- able to list files without downloading
- prevent files download duplication

## Troubleshooting
- If you are using 2FA on Google, you have to generate an [App Password](https://support.google.com/accounts/answer/185833?hl=en)