# node-whatsapp-drive-extractor

[!["Monthly Download"](https://img.shields.io/npm/dm/node-whatsapp-drive-extractor.svg)](https://npmjs.org/package/node-whatsapp-drive-extractor)
[!["Latest Release"](https://img.shields.io/npm/v/node-whatsapp-drive-extractor.svg)](https://github.com/ShaunLWM/node-whatsapp-drive-extractor/releases/latest)
[![MIT license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/ShaunLWM/node-whatsapp-drive-extractor/blob/master/LICENSE)

Download your synced WhatsApp medias from Google Drive backup

![script preview](https://i.imgur.com/KTnTeji.png)

## Requirement
- NodeJS v8 and above
- Retrieve your Device Id using [this](https://play.google.com/store/apps/details?id=com.evozi.deviceid)

## Usage
```
Usage:
        $ waex
Options
        --email, -e             Set your Google login email (compulsory)
        --password, -p          Set your Google password, Read troubleshooting if you have problem (compulsory)
        --phone, -n             Set your phone number (compulsory)
        --devid, -i             Set your device Id (compulsory)

        # either one of the commands below is needed
        --list, -l              List all available files to download
        --download, -d          Download all available files
        --output, -o            Directory to download media to. Use with --download (default: current directory)
        --debug                 Print debugging message (default: false)

	Examples
        $ waex -e YOUR_EMAIL@gmail.com -p YOUR_PASSOWRD -p YOUR_PHONE -i YOUR_DEVICEID --list
        # app will login & will list all files to download

        $ waex -e YOUR_EMAIL@gmail.com -p YOUR_PASSOWRD -p YOUR_PHONE -i YOUR_DEVICEID --download
        # app will login & starts downloading all files to current directory

        $ waex -e YOUR_EMAIL@gmail.com -p YOUR_PASSOWRD -p YOUR_PHONE -i YOUR_DEVICEID --download --output "C:\"
        # app will login & starts downloading all files to given output directory
```

## Instructions
1. ```npm install -g node-whatsapp-drive-extractor``` or ```yarn global add node-whatsapp-drive-extractor```
2. Follow the usage stated above

## TODO
- None for now

## Troubleshooting
- If you are using 2FA on Google, you have to generate an [App Password](https://support.google.com/accounts/answer/185833?hl=en)

## Credits
- [YuriCosta/WhatsApp-GD-Extractor-Multithread](https://github.com/YuriCosta/WhatsApp-GD-Extractor-Multithread)

## License
MIT License - Copyright (c) 2019 Shaun