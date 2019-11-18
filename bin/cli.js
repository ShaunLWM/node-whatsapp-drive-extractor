#!/usr/bin/env node

const meow = require("meow");
const WhatsAppExtrator = require("../index");
let debugMode = false;

const cli = meow(`
	Usage:
        $ waex
    Options
        --email, -e     Set your Google login email (compulsory)
        --password, -p  Set your Google password, Read troubleshooting if you have problem (compulsory)
        --phone, -n     Set your phone number (compulsory)
        --devid, -i     Set your device Id (compulsory)

        # either one of the commands below is needed
        --list, -l          List all available files to download
        --download, -d      Download all available files
        --output, -o        Directory to download media to. Use with --download (default: current directory)
        --debug             Print debugging message (default: false)

	Examples
        $ waex -e YOUR_EMAIL@gmail.com -p YOUR_PASSOWRD -n YOUR_PHONE -i YOUR_DEVICEID --list
        # app will login & will list all files to download

        $ waex -e YOUR_EMAIL@gmail.com -p YOUR_PASSOWRD -n YOUR_PHONE -i YOUR_DEVICEID --download
        # app will login & starts downloading all files to current directory

        $ waex -e YOUR_EMAIL@gmail.com -p YOUR_PASSOWRD -n YOUR_PHONE -i YOUR_DEVICEID --download --output "C:"
        # app will login & starts downloading all files to given output directory
        # WARNING: DO NOT end your output folder with "\" - example: "C:\" <- this wil cause a problem
`, {
    flags: {
        email: {
            type: "string",
            alias: "e",
        },
        password: {
            type: "string",
            alias: "p",
        },
        phone: {
            type: "string",
            alias: "n",
        },
        devid: {
            type: "string",
            alias: "i",
        },
        list: {
            type: "boolean",
            alias: "l",
            default: false
        },
        debug: {
            type: "boolean",
            default: false
        },
        download: {
            type: "boolean",
            alias: "d",
            default: false
        },
        output: {
            type: "string",
            alias: "o",
            default: "."
        }
    }
});


function printDebug(msg) {
    if (debugMode) console.log(msg);
}

(async () => {
    const { email, password, phone, devid, debug, list, download, output } = cli.flags;
    debugMode = debug;
    try {
        let Extrator = new WhatsAppExtrator({ email, password, phone, devid });
        printDebug(`[@] trying to login`);
        Extrator.setDownloadBaseDirectory(output);
        let token = await Extrator.getGoogleAccountTokenFromAuth();
        printDebug(`[@] got token from google`);
        let bearer = await Extrator.getGoogleDriveToken(token);
        printDebug(`[@] got bearer token`);
        await Extrator.gDriveFileMap();
        printDebug(`[@] got files`);
        if (list) return console.log(Extrator.getFileList());
        if (download) return await Extrator.downloadAll(output);
    } catch (error) {
        console.error(error);
    }
})();