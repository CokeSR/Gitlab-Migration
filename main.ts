import fs from 'fs/promises'
import cmd from "node-cmd"
import { LoadGlobalConfig } from "./src/utils/loadConfig.js";
import { LoadGlobalRequest } from "./src/api/request.js";
import { GitCloneSaveIn } from './src/global.js';
import {
    PushRepositoryMirrorFronGitea, PullRepositoryMirrorFromGitlab, QueryRepositoryFromGitlab, 
    CreateRepositoryToGitea, QueryOrganizeFromGitlab, CreateOrganizeToGitea
} from "./src/utils/execute.js";

import type { GlobalEnvConfig, GlobalRequestConfig, GitlabRepositoryInfo, GitlabOrganizeInfo } from './src/structs/config.js';

// 加载全局配置
export const env: GlobalEnvConfig | void = LoadGlobalConfig()
if (!env) process.exit(0)

export const { Gitlab, Gitea }: GlobalRequestConfig  = LoadGlobalRequest(env)

// 重置 mirrors 目录
//fs.rm(GitCloneSaveIn, { recursive: true, force: true })

if (process.platform === "win32") {
    const i18nSetting: string[] = [
        "git config --global core.quotepath false",
        "git config --global i18n.logOutputEncoding utf-8",
        "git config --global i18n.commitEncoding utf-8",
    ]
    for (let set of i18nSetting){
        cmd.run(set)
    }
}

export async function StartMigrationToGitea(env: GlobalEnvConfig){
    const gitlabOrganizeInfo: GitlabOrganizeInfo[] = await QueryOrganizeFromGitlab()
    const gitlabRepoInfos: GitlabRepositoryInfo[] = await QueryRepositoryFromGitlab()
    
    await CreateOrganizeToGitea(gitlabOrganizeInfo)
    await CreateRepositoryToGitea(gitlabRepoInfos)
    await PullRepositoryMirrorFromGitlab(gitlabRepoInfos)
    await PushRepositoryMirrorFronGitea(gitlabRepoInfos, env)
}

StartMigrationToGitea(env)
