export interface DownloadOptions {
    url: string,
    directory?: string,
    filename?: string,
    title?: string,
    description?: string,
    headers?: Array<{header: string, value: string}>,
    disableMetered?: boolean,
    disableRoaming?: boolean,
    mimeType?: string,
    notificationVisibility?: number
}

export interface DownloadResult {
    success: boolean,
    uri: any
}
