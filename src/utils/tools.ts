import cmd from 'node-cmd';
import type { GlobalEnvConfig } from '../structs/config.js';

/**
 * gitlab 仓库名规范化（适配gitea）
 * @param name 仓库名称
 */
export function normalizeRepoName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')              // 空格 → -
    .replace(/[^a-z0-9._-]/g, '')      // 去非法字符
    .replace(/-+/g, '-')               // 多个 - → 一个
    .replace(/^-|-$/g, '')             // 去头尾 -
}

/**
 * git promise 封装
 * @param command 系统命令
 */
export function runGitCommand(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
        cmd.run(command, (error, stdout, stderr) => {
            if (error) {
                reject(error)
            } else {
                console.log(stderr.replaceAll("\n", ""))
                resolve()
            }
        })
    })
}

// Eg: http://<user>:<access_key>@localhost:3000/user/repo.git
export function JoinTokenUrl(repoUrl: string, username: string, accessKey: string): string {
    const proto = repoUrl.split('://')[0]
    repoUrl = repoUrl.replace(proto + "://", `${proto}://${username}:${accessKey}@`)
    return repoUrl
}
