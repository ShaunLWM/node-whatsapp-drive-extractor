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

        # either one of the commands below is needed
        --list, -l          List all available files to download
        --download, -d      Download all available files
        --output, -o      Directory to download media to. Use with --download (default: current directory)
        --debug         Print debugging message (default: false)

	Examples
        $ waex -e YOUR_EMAIL@gmail.com -p YOUR_PASSOWRD -p 1234567890 --list
        # app will login & will list all files to download

        $ waex -e YOUR_EMAIL@gmail.com -p YOUR_PASSOWRD -p 1234567890 --download
        # app will login & starts downloading all files to current directory

        $ waex -e YOUR_EMAIL@gmail.com -p YOUR_PASSOWRD -p 1234567890 --download --output "C:\"
        # app will login & starts downloading all files to given output directory
        …
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
    const { email, password, phone, debug, list, download, output } = cli.flags;
    debugMode = debug;
    try {
        let Extrator = new WhatsAppExtrator({ email, password, phone });
        printDebug(`[@] trying to login`);
        Extrator.setDownloadBaseDirectory(output);
        let token = await Extrator.getGoogleAccountTokenFromAuth();
        printDebug(`[@] got token from google`);
        let bearer = await Extrator.getGoogleDriveToken(token);
        printDebug(`[@] got bearer token`);
        let drives = await Extrator.gDriveFileMap();
        printDebug(`[@] got drives`);
        drives.map(async (drive, i) => {
            let folder = "WhatsApp";
            if (drives.length > 1) {
                printDebug(`[-] Backup: ${i}`);
                folder = `WhatsApp-${i}`;
            }

            Extrator.getMultipleFiles(drive["results"], folder);
            printDebug("[@] file list successfully downloaded..");
            if (list) {
                return console.log(Extrator.getFileList());
            }

            if (download) {
                await Extrator.downloadAll(output);
                return Extrator.closeFileStream();
            }
        });
    } catch (error) {
        console.error(error);
    }
})();