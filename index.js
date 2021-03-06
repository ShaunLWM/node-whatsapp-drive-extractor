const request = require("request");
const encryptLogin = require("./modules/Google").encryptLogin;
const path = require("path");
const fs = require("fs-extra");
const config = require("./config");
const async = require("async");
const download = require("download");

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
		this.downloadBaseDirectory = ".";
	}

	setDownloadBaseDirectory(path = ".") {
		this.downloadBaseDirectory = path.replace("/", path.sep);
	}

	async getGoogleAccountTokenFromAuth() {
		const payload = {
			Email: this.gmail,
			EncryptedPasswd: encryptLogin(this.gmail, this.passw),
			app: this.client_pkg,
			client_sig: this.client_sig,
			parentAndroidId: this.devid,
		};

		try {
			const opts = {
				url: "https://android.clients.google.com/auth",
				form: payload,
				headers: {
					"User-Agent":
						"WhatsApp/2.19.291 Android/5.1.1 Device/samsung-SM-N950W",
				},
			};

			const results = await this.fetch(opts, true);
			const match = /Token=(.*?)\n/g.exec(results);
			if (match.length < 1)
				throw new Error(
					"[!] getGoogleAccountTokenFromAuth: no auth token found"
				);

			return match[1];
		} catch (error) {
			if (typeof error === "object")
				throw new Error(
					`[!] getGoogleAccountTokenFromAuth status: ${error.body}`
				);

			throw new Error(`[!] getGoogleAccountTokenFromAuth: ${error}`);
		}
	}

	async getGoogleDriveToken(token) {
		const payload = {
			Token: token,
			app: this.pkg,
			client_sig: this.sig,
			device: this.devid,
			google_play_services_version: this.client_ver,
			service:
				"oauth2:https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file",
			has_permission: "1",
		};

		const opts = {
			url: "https://android.clients.google.com/auth",
			form: payload,
			headers: {
				"User-Agent": "WhatsApp/2.19.291 Android/5.1.1 Device/samsung-SM-N950W",
			},
		};

		try {
			let response = await this.fetch(opts, true);
			if (response.substring(response.length - 1, response.length) !== "\n")
				response = `${response}\n`;
			const match = /Auth=(.*?)\n/g.exec(response);
			if (match === null || match.length < 1)
				throw new Error(
					`[!] getGoogleDriveToken: unable to parse bearer token ${response}`
				);

			this.bearer = match[1];
			return this.bearer;
		} catch (error) {
			throw new Error(`[!] getGoogleDriveToken error ${error}`);
		}
	}

	async rawGoogleDriveRequest(url) {
		try {
			const opts = {
				url,
				headers: {
					Authorization: `Bearer ${this.bearer}`,
					"User-Agent":
						"WhatsApp/2.19.291 Android/5.1.1 Device/samsung-SM-N950W",
					"Content-Type": "application/json; charset=UTF-8",
					Connection: "Keep-Alive",
				},
			};

			const results = await this.fetch(opts);
			return results;
		} catch (error) {
			throw new Error(`[!] rawGoogleDriveRequest: ${error}`);
		}
	}

	async gDriveFileMap(nextPageToken) {
		try {
			const data = await this.gDriveFileMapRequest(this.bearer, nextPageToken);
			const jres = JSON.parse(data);

			let incomplete_backup_marker = false;
			const description_url = `https://backup.googleapis.com/v1/clients/wa/backups/${this.celnumbr}`;
			const description = await this.rawGoogleDriveRequest(description_url);

			if (typeof jres["files"] === "undefined")
				throw new Error("Unable to locate Google Drive Whatsapp backup.");

			if (description["title"].includes("invisible")) {
				for (const p in result["properties"]) {
					if (
						p["key"] === "incomplete_backup_marker" &&
						p["value"].toString() === "true"
					)
						incomplete_backup_marker = true;
				}
			}

			if (jres["files"].length === 0) {
				if (incomplete_backup_marker)
					throw new Error(
						"[!] incomplete backup. it may be corrupted. try and backup again."
					);
				else throw new Error("[!] no backup files found.");
			}

			if (typeof jres["nextPageToken"] !== "undefined")
				this.gDriveFileMap(jres["nextPageToken"]);

			this.workerQueue = jres["files"].map((file) => {
				return file["name"];
			});
		} catch (error) {
			throw new Error(`[!] gDriveFileMap error ${error}`);
		}
	}

	async gDriveFileMapRequest(bearer, nextPageToken) {
		const url = `https://backup.googleapis.com/v1/clients/wa/backups/${this.celnumbr}/files?pageToken=${nextPageToken}&pageSize=5000`;
		try {
			const opts = {
				url,
				headers: {
					Authorization: `Bearer ${bearer}`,
					"User-Agent":
						"WhatsApp/2.19.291 Android/5.1.1 Device/samsung-SM-N950W",
					"Content-Type": "application/json; charset=UTF-8",
					Connection: "Keep-Alive",
				},
			};

			const results = await this.fetch(opts);
			return results;
		} catch (error) {
			throw new Error(`[!] gDriveFileMapRequest: ${error}`);
		}
	}

	getFileList() {
		return this.workerQueue;
	}

	async downloadAll(output = ".") {
		console.log("[@] trying to download all the files now..");
		if (this.workerQueue.length < 1) throw new Error("[!] Nothing to download");
		console.log(`[@] ${this.workerQueue.length} files to download..`);
		let totalItems = this.workerQueue.length;
		let currentIndex = 1;
		async.eachSeries(
			this.workerQueue,
			async (item, callback) => {
				let downloadFilePath = path.join(
					this.downloadBaseDirectory,
					"Whatsapp",
					item.replace("/", path.sep)
				);
				fs.ensureDirSync(path.dirname(downloadFilePath));
				if (fs.pathExistsSync(downloadFilePath)) {
					const stat = fs.lstatSync(downloadFilePath);
					if (stat.isFile()) fs.unlinkSync(downloadFilePath);
				}

				try {
					await download(
						`https://backup.googleapis.com/v1/${item}?alt=media`,
						path.dirname(downloadFilePath),
						{
							headers: {
								Authorization: `Bearer ${this.bearer}`,
								"User-Agent":
									"WhatsApp/2.19.291 Android/5.1.1 Device/samsung-SM-N950W",
								"Content-Type": "application/json; charset=UTF-8",
								Connection: "Keep-Alive",
							},
							filename: path.basename(downloadFilePath),
						}
					);

					console.log(
						`[-] downloaded ${downloadFilePath}  (${currentIndex}/${totalItems})`
					);
					currentIndex++;
				} catch (error) {
					console.error(error);
					return callback();
				}
			},
			(error) => {
				throw new Error(error);
			}
		);
	}

	async fetch(opts, isPost = false) {
		return new Promise((resolve, reject) => {
			if (isPost) {
				return request.post(opts, function (error, response, body) {
					if (error) return reject(error);
					if (response.statusCode !== 200)
						return reject({ status: response.statusCode, body });
					return resolve(body);
				});
			}

			request(opts, function (error, response, body) {
				if (error) return reject(error);
				if (response.statusCode !== 200)
					return reject({ status: response.statusCode, body });
				return resolve(body);
			});
		});
	}
}

module.exports = Extractor;
