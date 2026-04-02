import * as dotenv from 'dotenv';
dotenv.config();

import type { GlobalEnvConfig } from '../structs/config.js';

type allowConfigType = string | undefined

export function LoadGlobalConfig(): GlobalEnvConfig | void {
    const config: allowConfigType[] = [
        process.env.GITLAB_BASE_URL, process.env.GITLAB_ACCESS_KEY,
        process.env.GITEA_BASE_URL, process.env.GITEA_ACCESS_KEY,
        process.env.GITLAB_USERNAME, process.env.GITEA_USERNAME
    ]

    for (let item of config) {
        if (!item) {
            console.error(`Failed loading env: some options is undefined`)
            return
        }
    }

    return {
        GITLAB_USERNAME: process.env.GITLAB_USERNAME,
        GITLAB_BASE_URL: process.env.GITLAB_BASE_URL,
        GITLAB_ACCESS_KEY: process.env.GITLAB_ACCESS_KEY,
        GITEA_USERNAME: process.env.GITEA_USERNAME,
        GITEA_BASE_URL: process.env.GITEA_BASE_URL,
        GITEA_ACCESS_KEY: process.env.GITEA_ACCESS_KEY,
    }
}
