import axios from "axios";
import type { GlobalRequestConfig } from "../structs/config.js";
import type { GlobalEnvConfig } from "../structs/config.js";

export function LoadGlobalRequest(env: GlobalEnvConfig): GlobalRequestConfig {
    return {
        Gitlab: axios.create({
            baseURL: env.GITLAB_BASE_URL + "/api/v4",
            withCredentials: true,
            headers: {
                "PRIVATE-TOKEN": env.GITLAB_ACCESS_KEY
            }
        }),
        Gitea: axios.create({
            baseURL: env.GITEA_BASE_URL + "/api/v1",
            withCredentials: true,
            headers: {
                Authorization: `token ${env.GITEA_ACCESS_KEY}`
            }
        })
    }
}
