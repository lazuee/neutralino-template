const CURL = NL_OS === "Windows" ? "start /B /WAIT C:\\Windows\\System32\\curl.exe" : "curl";

const checkForUpdates = async (url = "") => {
	try {
		let manifest = await Neutralino.updater.checkForUpdates(url + "/manifest.json");
		if (NL_APPVERSION !== "0.0.0" && manifest.version !== NL_APPVERSION) {
			const install = () => {
				return new Promise((resolve, reject) => {
					try {
						let comand = `${CURL} ${url}/public/resources.neu --output resources.neu`;
						window.Neutralino.os.execCommand(comand).then(resolve);
					} catch (err) {
						reject(err);
					}
				});
			};

			console.info("[update]", { from: NL_APPVERSION, to: manifest.version });
			await Promise.all([install(), new Promise((resolve) => setTimeout(resolve, 5000))]);
			await Neutralino.app.restartProcess();
		} else {
			console.info("[update]", "No update required");
		}
	} catch (err) {
		console.error("[update]", err.message);
	}
};

const setTray = async () => {
	if (NL_OS == "Darwin") return;

	const tray = {
		icon: "/www/icons/app.png",
		menuItems: [
			{ id: "SHOW_HIDE", text: neutralino.visible ? "Hide" : "Show" },
			{ id: "SEP", text: "-" },
			{ id: "QUIT", text: "Quit", isChecked: true },
		],
	};

	await Neutralino.os.setTray(tray).catch((err) => {
		console.error("[tray]", err.message);
	});
	console.info("[tray]", "Loaded")
};

const eutralino = async () => {
	await Neutralino.init();
	console.info("[neutralino]", "initialized");
	await checkForUpdates("https://lazuee.github.io/neutralino-template");

	let datapath = await Neutralino.os.getPath("data");
	console.info("[neutralino]", `Roaming folder: ${datapath}`);

	let downloadsPath = await Neutralino.os.getPath("downloads");
	console.info("[neutralino]", `Downloads folder: ${downloadsPath}`);
	console.info("[neutralino]", `ID: ${NL_APPID} `);
	console.info("[neutralino]", `Current Dir: ${NL_CWD}`);
	console.info("[neutralino]", `App path: ${NL_PATH}`);
	console.info("[neutralino]", `args: ${NL_ARGS}`);

	Neutralino.events.on("trayMenuItemClicked", async (event) => {
		switch (event.detail.id) {
			case "SHOW_HIDE":
				neutralino.visible = !neutralino.visible;
				const method = neutralino.visible ? "show" : "hide";
				await setTray();
				await Neutralino.window[method]();
				if (neutralino.visible) Neutralino.window.focus();
				break;
			case "QUIT":
				await Neutralino.app.killProcess();
				break;
			default:
				break;
		}
	});
	Neutralino.events.on("serverOffline", async () => {
		const response = await Neutralino.os.showMessageBox("Error: App is not responding", "Try to restart app", "RETRY_CANCEL", "ERROR");

		if (response === "RETRY") Neutralino.app.restartProcess();
	});
	Neutralino.events.on("windowClose", async () => {
		await Neutralino.app.killProcess();
	});
	
	await setTray();
};

window.neutralino = {
	visible: true,
};
window.addEventListener(
	"mouseup",
	async (event) => {
		event.preventDefault();
	},
	{ passive: false }
);

window.addEventListener(
	"contextmenu",
	async (event) => {
		event.preventDefault();
	},
	{ passive: false }
);
window.addEventListener(
	"DOMContentLoaded",
	async () => {
		try {
			await eutralino();
		} catch (err) {
			console.error("[main]", err);
		}
	},
	{ passive: false }
);
