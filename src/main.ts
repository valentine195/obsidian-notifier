import "./main.css";

import { Plugin, PluginSettingTab, Setting } from "obsidian";
import { NotifierSettings } from "./@types";

const DEFAULT_SETTINGS: NotifierSettings = {
    always: false,
    hide: true
};

import icon from "../assets/obsidian.png";

export default class Notifier extends Plugin {
    settings: NotifierSettings;
    observer: MutationObserver;
    async onload() {
        await this.loadSettings();
        this.app.workspace.onLayoutReady(async () => {
            this.addSettingTab(new NotifierSettingsTab(this));
            const browser = require("@electron/remote").getCurrentWindow();
            this.observer = new MutationObserver((mutations) => {
                if (!this.settings.always && browser.isFocused()) return;
                for (const mutation of mutations) {
                    if (!mutation.addedNodes || !mutation.addedNodes.length)
                        continue;
                    for (const node of Array.from(mutation.addedNodes)) {
                        if (!(node instanceof HTMLDivElement)) continue;
                        if (!node.hasClass("notice-container")) continue;
                        if (this.settings.always || !browser.isFocused()) {
                            this.displayNotification(node.innerText);
                            if (this.settings.hide) node.detach();
                        }
                    }
                }
            });

            this.observer.observe(document.body, {
                childList: true,
                attributes: false,
                subtree: false
            });
        });
    }
    displayNotification(message: string) {
        if (Notification.permission == "granted") {
            this.buildNotification(message);
        } else if (Notification.permission != "denied") {
            Notification.requestPermission().then((perm) => {
                if (perm == "granted") {
                    this.buildNotification(message);
                }
            });
        }
    }
    buildNotification(message: string) {
        new Notification("Obsidian", {
            icon: icon,
            badge: icon,
            body: message
        });
    }

    onunload() {
        this.observer.disconnect();
        this.observer = null;
    }

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        );
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class NotifierSettingsTab extends PluginSettingTab {
    constructor(public plugin: Notifier) {
        super(plugin.app, plugin);
    }
    display() {
        this.containerEl.empty();
        this.containerEl.createEl("h3", { text: "Obsidian Notifier" });
        new Setting(this.containerEl.createDiv())
            .setName("Always display system notifications")
            .setDesc(
                "The plugin will always show system notifications, even if Obsidian is focused."
            )
            .addToggle((t) =>
                t.setValue(this.plugin.settings.always).onChange((v) => {
                    this.plugin.settings.always = v;
                    this.plugin.saveSettings();
                })
            );
        new Setting(this.containerEl.createDiv())
            .setName("Hide original notification")
            .setDesc("The plugin will hide the original Obsidian notification.")
            .addToggle((t) =>
                t.setValue(this.plugin.settings.hide).onChange((v) => {
                    this.plugin.settings.hide = v;
                    this.plugin.saveSettings();
                })
                
            );
    }
}
