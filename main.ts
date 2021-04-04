import { App, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

interface MyPluginSettings {
	filaPath: string;
	updateTime: any;
	randomNum: any;
	nextTime: any
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	filaPath: '知识殿堂/名言警句.md',
	randomNum: 0,
	updateTime: 600000,
	nextTime: null,
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	aWordBar: HTMLElement;
	async onload() {
		let u = this
		setTimeout(async function () {
			console.log("loading plugin");
			u.aWordBar = u.addStatusBarItem();
			await u.loadSettings();
			const fileFullWord = await u.readFileDataList(u.settings.filaPath)
			u.setAWord(fileFullWord)
			u.addRibbonIcon('dice', '切换句子', () => {
				u.saveSettings();
				u.setAWord(fileFullWord)
			});
			u.addSettingTab(new SampleSettingTab(u.app, u));
			u.registerInterval(window.setInterval(() => {
				if (new Date().getTime() >= u.settings.nextTime) {
					u.setAWord(fileFullWord)
				}
			}, 1000));
		}, 1000);
	}


	onunload() {
		// this.saveSettings();
		console.log('unloading plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async readFileData(path: string) {
		let file = this.app.vault.getAbstractFileByPath(path);

		if (file instanceof TFile) {
			const filedata = await this.app.vault.read(file)
			return filedata
		}
	}

	async readFileDataList(path: string) {
		let pathList = path.split(";")
		let fileFullWord = ""
		for (let i = 0; i < pathList.length; i++) {
			fileFullWord += await this.readFileData(pathList[i]) + "\n"
		}
		return fileFullWord
	}

	setAWord(data: any) {
		let lines = data.match(/[#]( .*)/g)
		// console.log("[Daily aphorism] File Data:", data);
		let aword
		let aHoverData
		if (!lines) {
			console.log("没有匹配到内容");
			aword = "没有匹配到内容"
		} else {
			let max = lines.length;
			let min = 0;
			let randomNum = Math.floor(Math.random() * (max - min)) + min
			console.log("[Daily aphorism] Last Random Number:", this.settings.randomNum);
			console.log("[Daily aphorism] Current Rndom Number:", randomNum);
			if (randomNum == this.settings.randomNum) {
				if (randomNum < max - 1) {
					randomNum += 1
					console.log("inrm", randomNum);

					this.settings.randomNum = randomNum
				} else {
					randomNum -= 1
					console.log("inrm", randomNum);
					this.settings.randomNum = randomNum
				}
			} else {
				this.settings.randomNum = randomNum
			}
			aword = lines[randomNum].split("# ")[1]
			aHoverData = data.split("# ")[randomNum]
		}
		this.aWordBar.setText("[ " + `${aword}` + " ]");
		this.aWordBar.setAttribute("class", "status-bar-item a-daily-reminder-bar-item")
		this.settings.nextTime = new Date().getTime() + Number(this.settings.updateTime)
		console.log("[Daily aphorism] Sentence:", aword);
		console.log("[Daily aphorism] Update Frequency:", this.settings.updateTime);
		console.log("[Daily aphorism] Next Update Time:", this.settings.nextTime);
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: '每日警句' });

		let currFilepath: string;
		if (this.plugin.settings.filaPath) {
			currFilepath = this.plugin.settings.filaPath
		} else {
			currFilepath = ""
		}
		new Setting(containerEl)
			.setName('分号分隔的多个文件')
			.setDesc('root/filename.md;root/filename2.md')
			.addTextArea(text => text
				.setPlaceholder('请输入文件路径')
				.setValue(currFilepath)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.filaPath = value;
					this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('句子更新时间')
			.setDesc('单位：毫秒')
			.addTextArea(text => text
				.setPlaceholder('请输入更新间隔')
				.setValue(this.plugin.settings.updateTime)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.updateTime = value;
					this.plugin.saveSettings();
				}));
	}
}
