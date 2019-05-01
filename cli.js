const meow = require("meow");
const Extrator = require("./index");

const cli = meow(`
	Usage:
        $ waex
	Options
        --list          List all available files to download
        --download      Download all available files
        --output        Directory to download media to. Use with --download
	Examples
        $ waex --list
        # app will list all files to download
        $ waex --download
        # app starts downloading all files to current directory
        $ waex --download --output "C:\"
        # app starts downloading all files to given output directory
        …
`, {
        flags: {
            list: {
                type: "boolean",
                default: false
            },
            download: {
                type: "boolean",
                default: false
            },
            output: {
                type: "string",
                alias: "o",
                default: "."
            }
        }
    });

(async () => {
    const { list, download, output } = cli.flags;
    try {
        console.log(`[@] trying to login`);
        Extrator.setDownloadBaseDirectory(output);
        let token = await Extrator.getGoogleAccountTokenFromAuth();
        console.log(`[@] got token from google`);
        let bearer = await Extrator.getGoogleDriveToken(token);
        console.log(`[@] got bearer token`);
        let drives = await Extrator.gDriveFileMap();
        console.log(`[@] got drives`);
        drives.map(async (drive, i) => {
            let folder = "WhatsApp";
            if (drives.length > 1) {
                console.log(`[-] Backup: ${i}`);
                folder = `WhatsApp-${i}`;
            }

            Extrator.getMultipleFiles(drive["results"], folder);
            console.log("[@] file list successfully downloaded..");
            if (list) {
                return console.log(Extrator.getFileList());
            }

            if (download) {
                return await Extrator.downloadAll(output);
            }
        });
    } catch (error) {
        console.error(error);
    }
})();