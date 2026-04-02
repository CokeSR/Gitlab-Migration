import type { AxiosInstance } from "axios";

// 全局配置
export interface GlobalEnvConfig {
    GITLAB_BASE_URL: string | undefined
    GITLAB_ACCESS_KEY: string | undefined
    GITEA_BASE_URL: string | undefined
    GITEA_ACCESS_KEY: string | undefined
}

// 访问请求配置
export interface GlobalRequestConfig {
    Gitlab: AxiosInstance
    Gitea: AxiosInstance
}

// Gitlab 仓库信息
export interface GitlabRepositoryInfo {
    id: number
    name: string     // Eg: api tester
    description: string
    http_url_to_repo: string
    visibility: "public" | "private"
    namespace: {
        name: string // Eg: api tester
        path: string // Eg: api-tester
        kind: "user" | "group"
    }
}

// Gitlab 群组信息
export interface GitlabOrganizeInfo {
    name: string
    path: string
    description: string
    visibility: "public" | "private"
}
