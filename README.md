# node-whatsapp-drive-extractor

[!["Monthly Download"](https://img.shields.io/npm/dm/node-whatsapp-drive-extractor.svg)](https://npmjs.org/package/node-whatsapp-drive-extractor)
[!["Latest Release"](https://img.shields.io/npm/v/node-whatsapp-drive-extractor.svg)](https://github.com/ShaunLWM/node-whatsapp-drive-extractor/releases/latest)
[![MIT license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/ShaunLWM/node-whatsapp-drive-extractor/blob/master/LICENSE)

Download your synced WhatsApp medias from Google Drive backup

![script preview](https://i.imgur.com/KTnTeji.png)

## Requirement
- NodeJS v8 and above

## Usage
```
Usage:
        $ node cli.js --list/download --debug
Options
        --list          List all available files to download
        --download      Download all available files
        --output        Directory to download media to. Use with --download (default: current directory)
        --debug         Print debugging message (default: false)
Examples
        $ node cli.js --list
        # app will list all files to download
        $ node cli.js --download
        # app starts downloading all files to current directory
        $ node cli.js --download --output "C:\"
        # app starts downloading all files to given output directory
```

## Instructions
1. Clone the repository using "git clone xxx" or download  [master zip](https://github.com/ShaunLWM/node-whatsapp-drive-extractor/archive/master.zip)
2.  `yarn install` or `npm install`
3. Rename `config-sample.js` to `config.js` and fill in required details `gmail, passw & celnumbr`.
4. Run `npm start` or `node cli.js --help`.

## TODO
- None for now

## Troubleshooting
- If you are using 2FA on Google, you have to generate an [App Password](https://support.google.com/accounts/answer/185833?hl=en)

## Credits
- [YuriCosta/WhatsApp-GD-Extractor-Multithread](https://github.com/YuriCosta/WhatsApp-GD-Extractor-Multithread)

## License
MIT License - Copyright (c) 2019 Shaun