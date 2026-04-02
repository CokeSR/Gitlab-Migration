import fs from "fs"
import fp from 'fs/promises'
import pLimit from 'p-limit'
import { GitCloneSaveIn } from "../global.js";
import { Gitlab, Gitea } from "../../main.js";
import { JoinTokenUrl, normalizeRepoName, runGitCommand } from './tools.js';
import type { GitlabRepositoryInfo, GitlabOrganizeInfo } from '../structs/config.js';
import type { GlobalEnvConfig } from '../structs/config.js';
import type { LimitFunction } from "p-limit"

/**
 * 在gitlab查询当前账号中所有的组织信息
 * Query all organization information in the current account on GitLab
 */
export async function QueryOrganizeFromGitlab(): Promise<GitlabOrganizeInfo[]> {
    let page = 1
    let organize: GitlabOrganizeInfo[] = []

    try {
        while (true) {
            const result = (await Gitlab.get(`/groups?per_page=100&page=${page}`))
            const orgInfo: GitlabOrganizeInfo[] = result.data
            for (let info of orgInfo){
                const { name, path, description, visibility } = info
                organize.push({ name, path, description, visibility })
            }
            const nextPage: number | undefined = result.headers['x-next-page']
            if (!nextPage) break
            page = nextPage
        }
    } catch (err: any) {
        console.log(`Query organize info from gitlab failed: ${err} | response: ${JSON.stringify(err.response?.data)}`)
    }

    return organize
}

/**
 * 在gitlab查询当前账号中所有的仓库信息
 * Query all repository information in the current account on GitLab
 */
export async function QueryRepositoryFromGitlab(): Promise<GitlabRepositoryInfo[]> {
    let page = 1
    let details: GitlabRepositoryInfo[] = []

    try {
        while (true){
            const result = await Gitlab.get(`/projects?membership=true&per_page=100&page=${page}`)
            const repoInfo: GitlabRepositoryInfo[] = result.data

            for (let info of repoInfo){
                const { id, name, description, visibility, namespace, http_url_to_repo } = info
                details.push({ id, name, description, visibility, namespace, http_url_to_repo })
            }

            const nextPage: number | undefined = result.headers['x-next-page']
            if (!nextPage) break
            page = nextPage
        }
    } catch (err: any) {
        console.log(`Query repository info from gitlab failed: ${err} | response: ${JSON.stringify(err.response?.data)}`)
    }

    return details
}

/**
 * 拉取 gitlab 仓库 mirror
 * Pull GitLab repository mirror
 */
export async function PullRepositoryMirrorFromGitlab(gitlabRepoInfos: GitlabRepositoryInfo[], env: GlobalEnvConfig) {
    if (gitlabRepoInfos.length === 0) {
        return
    }

    const pullRepositoryLimit: LimitFunction = pLimit(3)
    const pullRepositoryTasks = gitlabRepoInfos.map(info => {
        const mirrorSaveIn = `${GitCloneSaveIn}/${normalizeRepoName(info.name)}.git`
        const gitCmd = `git clone --mirror ${JoinTokenUrl(info.http_url_to_repo, env.GITLAB_USERNAME || "", env.GITLAB_ACCESS_KEY || "")} ${mirrorSaveIn}`

        if (fs.existsSync(mirrorSaveIn)){
            console.log(`The mirror already exists, skip it`)
            //fp.rm(mirrorSaveIn, { recursive: true, force: true })
            return
        }

        return pullRepositoryLimit(async () => {
            console.log(`Try clone repository mirror from gitlab: ${info.name}`)
            await runGitCommand(gitCmd)
        })
    })

    await Promise.all(pullRepositoryTasks)
}

/**
 * 从 gitea 中创建组织
 * Create an organization in Gitea
 */
export async function CreateOrganizeToGitea(gitlabOrgs: GitlabOrganizeInfo[]){
    if (gitlabOrgs.length === 0) return
    const createOrganizeLimit: LimitFunction = pLimit(3)
    const createOrganizeTasks = gitlabOrgs.map(orgs => {
        return createOrganizeLimit(() => {
            Gitea.post("/orgs", {
                username: orgs.path,
                description: orgs.description,
                visibility: orgs.visibility
            }).then(res => {
                console.log(`Create gitea organize: ${orgs.name} success, id: ${res.data.id}`)
                return res.status
            }).catch(err => {
                console.log(`Create gitea organize failed: ${err.code} | response: ${JSON.stringify(err.response?.data)}`)
            })
        })
    })

    await Promise.all(createOrganizeTasks)
}

/**
 * 从 gitea 中创建仓库
 * Create a repository from Gitea
 */
export async function CreateRepositoryToGitea(gitlabRepoInfos: GitlabRepositoryInfo[]){
    if (gitlabRepoInfos.length === 0){
        return
    }

    const createRepositoryLimit: LimitFunction = pLimit(3)
    const createRepositoryTasks = gitlabRepoInfos.map(info => {
        const url = info.namespace.kind === 'group' ? `/orgs/${info.namespace.path}/repos` : `/user/repos`
        return createRepositoryLimit(() => {
            Gitea.post(url, {
                name: normalizeRepoName(info.name),
                description: info.description,
                private: info.visibility === "private",
                auto_init: false
            }).then(res => {
                console.log(`Create gitea repository: ${info.name} success, id: ${res.data.id}`)
            })
            .catch(err => {
                console.log(`Create gitea repository failed: ${err.code} | response: ${JSON.stringify(err.response?.data)}`)
            })
        })
    })

    await Promise.all(createRepositoryTasks)
}

/**
 * 推送 gitlab 仓库到 gitea
 * Push GitLab repository to Gitea
 */
export async function PushRepositoryMirrorFronGitea(gitlabRepoInfos: GitlabRepositoryInfo[], env: GlobalEnvConfig) {
    if (gitlabRepoInfos.length == 0) {
        return
    }

    const pushRepositoryLimit: LimitFunction = pLimit(3)
    const pushRepositoryTasks = gitlabRepoInfos.map(info => {
        // 网上查好像也可以这样直接传: git --git-dir=<repo>.git push --mirror http://<token>@localhost:3000/<path>.git
        // 浏览器可能会弹出授权窗口
        const mirrorSaveIn = `${GitCloneSaveIn}/${normalizeRepoName(info.name)}.git`
        const gitCmd = `git --git-dir=${mirrorSaveIn} push --mirror ${JoinTokenUrl(process.env.GITEA_BASE_URL || "", env.GITEA_USERNAME || "", env.GITEA_ACCESS_KEY || "")}/${info.namespace.path}/${normalizeRepoName(info.name)}.git`
        return pushRepositoryLimit(async () => {
            console.log(`Try uploading repository mirror to gitea: ${info.name}`)
            await runGitCommand(gitCmd)
        })
    })

    await Promise.all(pushRepositoryTasks)
}
