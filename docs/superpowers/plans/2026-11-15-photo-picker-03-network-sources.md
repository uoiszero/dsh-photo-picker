# Plan 3：网络照片源（SMB/NFS）

**状态：SMB 首版已实现，等待真实服务器手动验收**
**日期：2026-11-15**

## 目标

把「本机文件夹」之外的 NAS/共享目录接进现有工作台：

- macOS 输入 `smb://host/share`，用系统登录框连接；
- 挂载后的共享按只读照片源处理；
- 数据库、缩略图、预览、网格图始终在本地工作区；
- 网络断开时暂停阶段，重连后从现有游标继续；
- 不在插件里保存密码、不把密码写进 URL 或日志。

## 已实现

### 连接

- 新增 `plugin/src/host/network.js`：
  - `parseSmbUrl()`：校验 `smb://[user@]host/share[/subpath]`，拒绝密码出现在 URL 中；
  - `connectSmb()`：调用系统 `open "smb://..."`，轮询 `/Volumes`，90 秒内匹配共享挂载点；
  - 密码由 Finder/Keychain 处理，`openUrl` 只包含用户名，不包含密码。
- `platform.openUrl()`：macOS `open`、Windows `explorer`、Linux `xdg-open`。
- `POST /photo-picker/api/fs/smb/connect` 与 `GET /photo-picker/api/fs/volumes`。
- 建项目时 `source.kind='smb'`；`projects` 保存 `source_kind='smb'`、`source_path`、`mount_point`，并在项目库 `mounts` 写入连接记录。
- 新建项目 UI 增加「本机目录 / SMB 网络共享」切换、SMB 地址输入和连接按钮。

### 读源与安全

- 新增 `NetworkSource`/`sourceFor()`：挂载点复用本地只读文件访问。
- 所有工作区目录仍在本地；网络盘只作为源目录读取。
- 项目详情返回 `sourceOnline`，UI 显示「已挂载 / 网络源已断开」。

### 断线处理

- 网络源阶段启动前先检查 `source.health()`，不可用返回 `NETWORK_LOST`。
- 阶段运行中每 15 秒检查挂载点；连续 5 次失败后 abort 当前阶段，并把项目/运行中的阶段标记为 `paused`，写入 `NETWORK_LOST` 错误。
- 重连后重新启动阶段，已有游标/幂等数据继续生效。

## 未完成 / 限制

- **NFS 自动连接**：当前 NFS 需要先手动挂载，再按本机路径或 `nfs` 挂载路径建项目；`nfs://` 的系统连接尚未实现。
- **Windows 自动连接**：Windows 建议使用已映射网络盘或 UNC 路径；SMB 自动打开/poll `/Volumes` 目前是 macOS 路径。
- **自动卸载**：不会主动卸载共享，避免影响 Finder 中其它使用。
- **传输预估**：尚未实现建项目前的文件数/总大小/预估传输量。
- **凭据**：不存储密码；无人值守使用依赖系统 Keychain 或已挂载共享。

## 手动验收（使用 `192.168.12.199` 的 `yueao` 共享）

1. Finder 连接 `smb://192.168.12.199/yueao`，确认挂载到 `/Volumes/yueao`。
2. 工作台 → 新建项目 → **SMB 网络共享** → 输入  
   `smb://192.168.12.199/yueao` → 连接。
3. 确认显示挂载路径，创建项目；先跑 `scan`，确认照片列表和缩略图正常，且项目工作区在本地。
4. 运行 `preprocess` / AI 阶段；断开共享（Finder 推出或网络断开）观察阶段变为 paused，重连后继续。
5. 导出到本地目录，确认源共享目录只读、未被写入。

## 验收测试

- `node --test plugin/test/network.test.js`：URL 解析、已有挂载、等待新挂载、超时。
- `node --test plugin/test/projects.test.js`：SMB 项目持久化与 `mounts` 记录。
- `node --test plugin/test/http.test.js`：卷列表与 SMB connect 路由。
- `npm run verify`：全量门禁。
