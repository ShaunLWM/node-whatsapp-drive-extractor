const meow = require("meow");
const Extrator = require("./index");

const cli = meow(`
	Usage:
        $ waex
	Options
        --list          List all available files to download
        --download      Download all available files
	Examples
        $ waex --list
        # app will list all files to download
        $ pokemon --download
        # app starts downloading all files to current directory
        …
`, {
        flags: {
            list: {
                type: 'boolean',
                default: true
            },
            download: {
                type: 'boolean',
                default: false
            }
        }
    });

(async () => {
    const { list, download } = cli.flags;
    try {
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
                return await Extrator.downloadAll();
            }
        });
    } catch (error) {
        console.error(error);
    }
})();