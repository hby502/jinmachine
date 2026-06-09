# 锦越机械 JIN MACHINE — API 接口文档 v1.0.0

## 基础信息

| 项目 | 说明 |
|------|------|
| 基础路径 | `/api/v1` |
| 响应格式 | JSON |
| 字符编码 | UTF-8 |
| 认证方式 | Bearer JWT |

---

## 统一响应格式

**成功响应 (2xx):**
```json
{
  "code": "SUCCESS",
  "message": "操作成功",
  "data": { ... }
}
```

**失败响应 (4xx/5xx):**
```json
{
  "code": "PARAM_10001",
  "message": "用户友好提示信息"
}
```
> `detail` 字段仅在开发环境返回，生产环境不暴露。

---

## 错误码速查

| 错误码 | 说明 |
|--------|------|
| `PARAM_10001` | 必选参数缺失 |
| `PARAM_10005` | 枚举值不合法 |
| `AUTH_20001` | 未认证 |
| `AUTH_20002` | 令牌过期 |
| `AUTH_20004` | 无权限 |
| `AUTH_20005` | 账号已禁用 |
| `BIZ_30002` | 数据不存在 |
| `BIZ_30004` | 提交过于频繁 |
| `SYSTEM_50001` | 系统内部错误 |

---

## 1. 认证模块

### 1.1 管理员登录

```
POST /api/v1/auth/login
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 (2-50字符) |
| password | string | 是 | 密码 (6-100字符) |

**成功响应 (200):**
```json
{
  "code": "SUCCESS",
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "expiresIn": 86400,
    "user": { "id": "uuid", "username": "admin", "role": "super_admin", "permissions": ["inquiry:read", "inquiry:update", "inquiry:delete"] }
  }
}
```

### 1.2 获取当前用户

```
GET /api/v1/auth/me
Authorization: Bearer <accessToken>
```

### 1.3 刷新令牌

```
POST /api/v1/auth/refresh
```
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| refreshToken | string | 是 | 登录时获取的 refreshToken |

---

## 2. 留言/询盘模块

### 2.1 访客提交留言 ⭐ 公开接口

```
POST /api/v1/inquiries
```

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| name | string | 是 | — | 姓名 (1-50字符) |
| phone | string | 是 | — | 手机号 (7-15位数字) |
| company | string | 否 | null | 公司名称 (≤100字符) |
| materialType | enum | 是 | — | PET/R-PET/TPU/PE/PA/PLA/PBAT/PMMA/other |
| capacity | enum | 否 | unknown | 100-300/300-500/500-800/800+/unknown |
| message | string | 否 | "" | 需求描述 (≤2000字符) |

**Headers (可选):**
| Header | 说明 |
|--------|------|
| X-Idempotency-Key | UUID v4 幂等键，防止重复提交 |

**限流:** 每 IP 每分钟最多 5 次

**成功响应 (201):**
```json
{
  "code": "SUCCESS",
  "message": "留言已提交，我们将尽快联系您！",
  "data": { "id": "uuid", "name": "张三", "phone": "138****8000", "createdAt": "2026-06-09T10:30:00.000Z" }
}
```

### 2.2 查询留言列表 🔒

```
GET /api/v1/inquiries
Authorization: Bearer <accessToken>
权限: inquiry:read
```

| 参数 | 默认值 | 说明 |
|------|--------|------|
| page | 1 | 页码 |
| pageSize | 20 | 每页条数 (≤100) |
| status | — | 筛选状态 |
| materialType | — | 筛选物料类型 |
| startDate | — | 开始日期 (YYYY-MM-DD) |
| endDate | — | 结束日期 (YYYY-MM-DD) |
| keyword | — | 搜索关键词 (姓名/公司/电话) |
| sortBy | created_at | 排序字段 |
| sortOrder | DESC | ASC/DESC |

### 2.3 查看留言详情 🔒

```
GET /api/v1/inquiries/:id
Authorization: Bearer <accessToken>
权限: inquiry:read
```

### 2.4 更新留言状态 🔒

```
PUT /api/v1/inquiries/:id/status
Authorization: Bearer <accessToken>
权限: inquiry:update
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | enum | 是 | contacted/quoted/negotiating/won/lost/archived |
| notes | string | 否 | 跟进备注 (≤1000字符) |

### 2.5 删除留言 🔒 (仅超级管理员)

```
DELETE /api/v1/inquiries/:id
Authorization: Bearer <accessToken>
权限: inquiry:delete
```

---

## 3. 权限体系

| 角色 | 权限点 |
|------|--------|
| `super_admin` | `inquiry:read`, `inquiry:update`, `inquiry:delete`, `admin:create`, `admin:update`, `admin:delete` |
| `admin` | `inquiry:read`, `inquiry:update` |

---

## 4. 默认账号

首次部署后运行 `npm run seed` 创建默认管理员：

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123456 | super_admin |

⚠️ 请登录后立即修改密码！
