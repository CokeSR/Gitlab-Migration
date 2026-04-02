# GitLab Migration

一个基于 TypeScript 的自动化迁移脚本，用于将 GitLab 上的仓库（含群组）批量完整的迁移到 Gitea。

---

## 环境要求

* Node.js >= 20
* Git 已安装
* Gitea / GitLab 可访问且已经获取到足够权限的 ACCESS_TOKEN

---

## 运行

```bash
npm install
npm run dev
```

## 环境配置
- 在使用前注意核对 gitlab api 版本为 v4，gitea api 版本为 v1

```env
# .env
GITLAB_ACCESS_KEY=your_gitlab_token
GITEA_ACCESS_KEY=your_gitea_token

GITLAB_BASE_URL=http://localhost.com      # 纯地址，不含路径
GITEA_BASE_URL=http://localhost:3000    # 纯地址，不含路径
```

## 其他说明
1. 创建组织和仓库都有并发次数限制为 10，上传仓库的并发限制为 5
2. 一定要预留一部分空间用于存 mirror 文件（>=你的gitlab仓库容量）
2. 如果是第一次迁移，则gitea可能会弹出授权按钮确认，不要忘记了；如果出现了授权失败，就重新启动一遍
3. 如果有一部分迁移失败或者创建失败，就多跑几遍
