let request = require("request");
const encryptLogin = require("./modules/Google").encryptLogin;
const path = require("path");
const fs = require("fs-extra");
const config = require("./config");
const async = require("async");
const download = require("download");

request = request.defaults({
    headers: {
        "Accept-Language": "en-US,en-SG;q=0.9,en;q=0.8",
        "Connection": "keep-alive",
        "User-Agent": "Mozilla/5.0 (Linux; U; Android 2.2; en-gb; GT-P1000 Build/FROYO) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1"
    }
});

class Extractor {
    constructor({ email, password, phone, devid }) {
        this.gmail = email;
        this.passw = password;
        this.devid = devid;
        this.celnumbr = phone;
        this.pkg = config["app"]["pkg"];
        this.sig = config["app"]["sig"];
        this.client_pkg = config["client"]["pkg"];
        this.client_sig = config["client"]["sig"];
        this.client_ver = config["client"]["ver"];
        this.bearer = null;
        this.workerQueue = [];
        this.logStream = null;
        this.downloadBaseDirectory = ".";
        this.logfile = "";
    }

    setDownloadBaseDirectory(path = ".") {
        this.downloadBaseDirectory = path;
    }

    closeFileStream() {
        try {
            if (logStream !== null) this.logStream.end();
        } catch (error) { }
    }

    async getGoogleAccountTokenFromAuth() {
        let encpass = encryptLogin(this.gmail, this.passw);
        let payload = { "Email": this.gmail, "EncryptedPasswd": encpass, "app": this.client_pkg, "client_sig": this.client_sig, "parentAndroidId": this.devid };
        try {
            let opts = {
                url: "https://android.clients.google.com/auth",
                form: payload
            };

            let results = await this.fetch(opts, true);
            let match = /Token=(.*?)\n/g.exec(results);
            if (match.length < 1) {
                throw new Error("[!] getGoogleAccountTokenFromAuth: no auth token found")
            }

            return match[1];
        } catch (error) {
            if (typeof error === "object") {
                throw new Error(`[!] getGoogleAccountTokenFromAuth status: ${error.body}`);
            }

            throw new Error(`[!] getGoogleAccountTokenFromAuth: ${error}`);
        }
    }

    async getGoogleDriveToken(token) {
        let payload = { "Token": token, "app": this.pkg, "client_sig": this.sig, "device": this.devid, "google_play_services_version": this.client_ver, "service": "oauth2:https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file", "has_permission": "1" };
        let opts = {
            url: "https://android.clients.google.com/auth",
            form: payload
        };

        try {
            let response = await this.fetch(opts, true);
            let match = /Auth=(.*?)\n/g.exec(response);
            if (match.length < 1) {
                throw new Error("[!] getGoogleDriveToken: unable to parse bearer token");
            }

            this.bearer = match[1];
            return this.bearer;
        } catch (error) {
            throw new Error(`[!] getGoogleDriveToken error ${error}`);
        }
    }

    async rawGoogleDriveRequest(url) {
        try {
            let opts = {
                url,
                headers: {
                    "Authorization": `Bearer ${this.bearer}`
                }
            };

            let results = await this.fetch(opts);
            return results;
        } catch (error) {
            throw new Error(`[!] rawGoogleDriveRequest: ${error}`);
        }
    }

    async gDriveFileMap() {
        try {
            let data = await this.gDriveFileMapRequest(this.bearer);
            let jres = JSON.parse(data);
            let backup = await Promise.all(jres["items"].map(async result => {
                if (result["title"] === "gdrive_file_map") {
                    let results = await this.rawGoogleDriveRequest(`https://www.googleapis.com/drive/v2/files/${result["id"]}?alt=media`);
                    return {
                        description: result["description"],
                        results
                    };
                }
            }))

            if (backup.length < 1) {
                return new Error(`[!]gDriveFileMap: Unable to locate google drive file map for: ${this.pkg}`);
            }

            return backup.filter(b => b !== null && typeof b !== "undefined");
        } catch (error) {
            throw new Error(`[!] gDriveFileMap error ${error}`);
        }
    }

    async gDriveFileMapRequest(bearer) {
        let headers = {
            "Authorization": `Bearer ${bearer}`
        };

        let url = `https://www.googleapis.com/drive/v2/files?mode=restore&spaces=appDataFolder&maxResults=1000&fields=items(description%2Cid%2CfileSize%2Ctitle%2Cmd5Checksum%2CmimeType%2CmodifiedDate%2Cparents(id)%2Cproperties(key%2Cvalue))%2CnextPageToken&q=title%20%3D%20'${this.celnumbr}-invisible'%20or%20title%20%3D%20'gdrive_file_map'%20or%20title%20%3D%20'Databases%2Fmsgstore.db.crypt12'%20or%20title%20%3D%20'Databases%2Fmsgstore.db.crypt11'%20or%20title%20%3D%20'Databases%2Fmsgstore.db.crypt10'%20or%20title%20%3D%20'Databases%2Fmsgstore.db.crypt9'%20or%20title%20%3D%20'Databases%2Fmsgstore.db.crypt8'`
        try {
            let opts = {
                url,
                headers
            };

            let results = await this.fetch(opts);
            return results;
        } catch (error) {
            throw new Error(`[!] gDriveFileMapRequest: ${error}`);
        }
    }

    getMultipleFiles(results, folder) {
        try {
            let files = this.localFileList();
            let data = JSON.parse(results);
            for (const entries of data) {
                if (!files.includes(entries["m"]) || entries["f"].toLowerCase().includes("database")) {
                    let local = path.join(this.downloadBaseDirectory, folder, entries["f"].replace("/", path.sep));
                    if (fs.existsSync(local) && !local.toLowerCase().includes("database")) {
                        console.log(`[!] skipped ${local}`);
                    } else {
                        this.workerQueue.push({ entries_r: entries["r"], local, entries_m: entries["m"] });
                    }
                }
            }

            return true;
        } catch (error) {
            throw new Error(error);
        }
    }

    getFileList() {
        return this.workerQueue.map(file => {
            return file["local"];
        })
    }

    localFileList() {
        this.logfile = path.join(this.downloadBaseDirectory, "files.log");
        if (!fs.pathExistsSync(this.logfile)) {
            fs.ensureFileSync(this.logfile);
            return this.localFileList();
        }

        this.logStream = fs.createWriteStream(this.logfile, { flags: "a" });
        let flist = fs.readFileSync(this.logfile, "utf8");
        return flist.split("\n");
    }

    async downloadAll(output = ".") {
        console.log("[@] trying to download all the files now..");
        if (this.workerQueue.length < 1) {
            throw new Error("Nothing to download");
        }

        console.log(`[@] ${this.workerQueue.length} files to download..`);
        let totalItems = this.workerQueue.length;
        let currentIndex = 1;
        async.eachSeries(this.workerQueue, async (item, callback) => {
            let { entries_r, local, entries_m } = item;
            fs.ensureDirSync(path.dirname(local));
            if (fs.pathExistsSync(local)) {
                const stat = fs.lstatSync(local);
                if (stat.isFile()) {
                    fs.unlinkSync(local);
                }
            }

            try {
                await download(`https://www.googleapis.com/drive/v2/files/${entries_r}?alt=media`, path.dirname(local), {
                    headers: {
                        "Authorization": `Bearer ${this.bearer}`,
                    },
                    filename: path.basename(local)
                });

                console.log(`[-] downloaded ${local}  (${currentIndex}/${totalItems})`);
                this.logStream.write(`${entries_m}\n`);
                currentIndex++;
            } catch (error) {
                console.error(error);
                return callback();
            }
        }, error => {
            throw new Error(error);
        });
    }

    async fetch(opts, isPost = false) {
        return new Promise((resolve, reject) => {
            if (isPost) {
                return request.post(opts, function (error, response, body) {
                    if (error) {
                        return reject(error);
                    }

                    if (response.statusCode !== 200) {
                        return reject({ status: response.statusCode, body });
                    }

                    return resolve(body);
                });
            }

            request(opts, function (error, response, body) {
                if (error) {
                    return reject(error);
                }

                if (response.statusCode !== 200) {
                    return reject({ status: response.statusCode, body });
                }

                return resolve(body);
            });
        });
    }
}

module.exports = Extractor;