/// <reference path="./../../../node_modules/@nativescript/types-android/index.d.ts" />

import { DownloadOptions, DownloadResult } from "./../models/download-manager.model";
import { Utils, Application } from "@nativescript/core";

export enum notificationVisibility {
    VISIBILITY_HIDDEN = 2,
    VISIBILITY_VISIBLE = 0,
    VISIBILITY_VISIBLE_NOTIFY_COMPLETED = 1,
}

export class DownloadManager {
    public downloadQueue: Map<number, Function>;
    public manager: any;

    constructor() {
        this.downloadQueue = new Map<number, Function>();
        this.manager = Utils.ad.getApplicationContext().getSystemService(android.content.Context.DOWNLOAD_SERVICE);
        this._registerBroadcast();
    }

    public download(options: DownloadOptions, cb: (result: DownloadResult) => void): void {
        const uri = android.net.Uri.parse(options.url);
        const req = new android.app.DownloadManager.Request(uri);

        let directory = options.directory ?? android.os.Environment.DIRECTORY_DOWNLOADS;
        let filename = options.filename ?? options.url.substr(options.url.lastIndexOf("/") + 1);
        let title = options.title ?? filename;

        req.setDestinationInExternalPublicDir(directory, filename);
        req.setTitle(title);

        if (options.description) {
            req.setDescription(options.description);
        }

        if (options.headers && options.headers.length > 0) {
            for (let header of options.headers) {
                req.addRequestHeader(header.header, header.value);
            }
        }

        if (options.disableMetered) {
            req.setAllowedOverMetered(false);
        }

        if (options.disableRoaming) {
            req.setAllowedOverRoaming(false);
        }

        if (options.mimeType) {
            req.setMimeType(options.mimeType);
        }

        if (options.notificationVisibility) {
            req.setNotificationVisibility(options.notificationVisibility);
        }

        const id = this.manager.enqueue(req);
        this.downloadQueue.set(id, cb);
    }

    private _registerBroadcast(): void {
        Application.android.registerBroadcastReceiver(android.app.DownloadManager.ACTION_DOWNLOAD_COMPLETE, this._onDownloadEvent.bind(this));
    }

    private _onDownloadEvent(context: android.content.Context, intent: android.content.Intent): void {
        let query = new android.app.DownloadManager.Query();
        let id = intent.getExtras().getLong(android.app.DownloadManager.EXTRA_DOWNLOAD_ID);
        
        let c = this.manager.query(query);
        while (c.moveToNext()) {
            if (c.getLong(c.getColumnIndex(android.app.DownloadManager.COLUMN_ID)) == id) {
                let success;
                switch (c.getInt(c.getColumnIndex(android.app.DownloadManager.COLUMN_STATUS))) {
                    case android.app.DownloadManager.STATUS_SUCCESSFUL:
                        success = true;
                        break;
                    case android.app.DownloadManager.STATUS_FAILED:
                        success = false;
                    default:
                        success = false;
                        break;
                }
                if (this.downloadQueue.has(id)) {
                    let uri = c.getString(c.getColumnIndex(android.app.DownloadManager.COLUMN_LOCAL_URI));
                    let cb = this.downloadQueue.get(id);
                    let result: DownloadResult = { success, uri }
                    cb(result);
                }
                break;
            }
        }
        c.close();
    }

    public unregisterBroadcast(): void {
        Application.android.unregisterBroadcastReceiver(android.app.DownloadManager.ACTION_DOWNLOAD_COMPLETE);
    }
}
