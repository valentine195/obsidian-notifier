import "./main.css";

import { Notice, Plugin } from "obsidian";
import { PluginSettings } from "./@types";

import { around } from "monkey-around";

const DEFAULT_SETTINGS: PluginSettings = {};

import icon from "../assets/obsidian.png";

export default class MyPlugin extends Plugin {
    settings: PluginSettings;
    async onload() {
        await this.loadSettings();

        const browser = require("@electron/remote").getCurrentWindow();

        const self = this;
        this.register(
            around(Notice.prototype, {
                hide: function (old) {
                    return function () {
                        if (!browser.isFocused()) {
                            if (Notification.permission == "granted") {
                                self.buildNotification(this.noticeEl.innerText);
                            } else if (Notification.permission != "denied") {
                                Notification.requestPermission().then(
                                    (perm) => {
                                        if (perm == "granted") {
                                            self.buildNotification(
                                                this.noticeEl.innerText
                                            );
                                        }
                                    }
                                );
                            }
                        }

                        return old.call(this);
                    };
                }
            })
        );
    }

    buildNotification(message: string) {
        new Notification("Obsidian", {
            icon: icon,
            body: message
        });
    }

    onunload() {}

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
