# 博客系统后端API接口文档

## 接口概览

本博客系统后端提供以下主要功能模块的API接口：

- 用户管理 (UserController)
- 文章管理 (ArticleController)
- 评论管理 (CommentController)
- 分类管理 (CategoryController)
- 标签管理 (TagController)
- 点赞记录管理 (LikeRecordController)

所有接口的基础URL为：`http://localhost:8080/api`

## 用户管理接口 (UserController)

| 接口路径            | HTTP方法 | 功能描述 | 请求参数                                                | 响应格式                                                                            |
| --------------- | ------ | ---- | --------------------------------------------------- | ------------------------------------------------------------------------------- |
| /users/register | POST   | 用户注册 | `{"username":"用户名", "password":"密码", "email":"邮箱"}` | `{"code":200, "message":"注册成功", "data":{"id":"用户ID", "username":"用户名"}}`        |
| /users/login    | POST   | 用户登录 | `{"username":"用户名", "password":"密码"}`               | `{"code":200, "message":"登录成功", "data":{"token":"令牌", "user":{...}}}`，失败则返回错误信息 |
| /users/test     | GET    | 测试接口 | 无                                                   | `{"code":200, "message":"测试成功"}`                                                |

## 文章管理接口 (ArticleController)

| 接口路径           | HTTP方法 | 功能描述     | 请求参数                                                                              | 响应格式                                                                                                                                                                                                                 |
| -------------- | ------ | -------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| /articles      | POST   | 创建文章     | `{"title":"标题", "content":"内容", "categoryId":"分类ID", "tagIds":["标签ID1","标签ID2"]}` | `{"code":200, "message":"创建成功", "data":{"id":"文章ID", ...}}`                                                                                                                                                          |
| /articles      | GET    | 获取文章列表   | `page`(页码), `pageSize`(每页数量), `categoryId`(可选), `tagId`(可选)                       | `{"code":200, "message":"查询成功", "data":{"list":[...], "total":总数, "page":页码, "pageSize":每页数量}}`                                                                                                                      |
| /articles/{id} | GET    | 获取文章详情   | 路径参数: `id`(文章ID)                                                                  | `{"code":200, "message":"查询成功", "data":{"id":"文章ID", "title":"标题", "content":"内容", "category":{...}, "tags":[...], "viewCount":浏览量, "likeCount":点赞数, "commentCount":评论数, "createTime":"创建时间", "updateTime":"更新时间"}}` |
| /articles/{id} | PUT    | 更新文章     | 路径参数: `id`(文章ID), 请求体: 同创建文章                                                      | `{"code":200, "message":"更新成功", "data":{"id":"文章ID", ...}}`                                                                                                                                                          |
| /articles/{id} | DELETE | 删除文章     | 路径参数: `id`(文章ID)                                                                  | `{"code":200, "message":"删除成功"}`                                                                                                                                                                                     |
| /articles/hot  | GET    | 获取热门文章列表 | 无                                                                                 | `{"code":200, "message":"查询成功", "data":[{"id":"文章ID", "title":"标题", "viewCount":浏览量, ...}, ...]}`                                                                                                                    |

## 评论管理接口 (CommentController)

| 接口路径                          | HTTP方法 | 功能描述          | 请求参数                                                                | 响应格式                                                                                                                                |
| ----------------------------- | ------ | ------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| /comments/article/{articleId} | GET    | 根据文章ID获取评论列表  | 路径参数: `articleId`(文章ID)                                             | `{"code":200, "message":"查询成功", "data":[{"id":"评论ID", "content":"评论内容", "user":{...}, "createTime":"创建时间", "replies":[...]}, ...]}` |
| /comments                     | POST   | 创建评论          | `{"articleId":"文章ID", "content":"评论内容", "parentId":null(或回复的评论ID)}` | `{"code":200, "message":"评论成功", "data":{"id":"评论ID", ...}}`                                                                         |
| /comments/{id}                | DELETE | 删除评论          | 路径参数: `id`(评论ID)                                                    | `{"code":200, "message":"删除成功"}`                                                                                                    |
| /comments/replies/{parentId}  | GET    | 根据父评论ID获取回复列表 | 路径参数: `parentId`(父评论ID)                                             | `{"code":200, "message":"查询成功", "data":[{"id":"回复ID", "content":"回复内容", "user":{...}, "createTime":"创建时间"}, ...]}`                  |

## 分类管理接口 (CategoryController)

| 接口路径             | HTTP方法 | 功能描述     | 请求参数                                      | 响应格式                                                                                              |
| ---------------- | ------ | -------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| /categories      | POST   | 创建分类     | `{"name":"分类名称"}`                         | `{"code":200, "message":"创建成功", "data":{"id":"分类ID", "name":"分类名称"}}`                             |
| /categories      | GET    | 获取所有分类列表 | 无                                         | `{"code":200, "message":"查询成功", "data":[{"id":"分类ID", "name":"分类名称", "articleCount":文章数量}, ...]}` |
| /categories/{id} | GET    | 获取分类详情   | 路径参数: `id`(分类ID)                          | `{"code":200, "message":"查询成功", "data":{"id":"分类ID", "name":"分类名称", "articleCount":文章数量}}`        |
| /categories/{id} | PUT    | 更新分类     | 路径参数: `id`(分类ID), 请求体: `{"name":"新分类名称"}` | `{"code":200, "message":"更新成功", "data":{"id":"分类ID", "name":"新分类名称"}}`                            |
| /categories/{id} | DELETE | 删除分类     | 路径参数: `id`(分类ID)                          | `{"code":200, "message":"删除成功"}`                                                                  |

## 标签管理接口 (TagController)

| 接口路径                      | HTTP方法 | 功能描述         | 请求参数                                      | 响应格式                                                                                              |
| ------------------------- | ------ | ------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| /tags                     | POST   | 创建标签         | `{"name":"标签名称"}`                         | `{"code":200, "message":"创建成功", "data":{"id":"标签ID", "name":"标签名称"}}`                             |
| /tags                     | GET    | 获取所有标签列表     | 无                                         | `{"code":200, "message":"查询成功", "data":[{"id":"标签ID", "name":"标签名称", "articleCount":文章数量}, ...]}` |
| /tags/{id}                | GET    | 获取标签详情       | 路径参数: `id`(标签ID)                          | `{"code":200, "message":"查询成功", "data":{"id":"标签ID", "name":"标签名称", "articleCount":文章数量}}`        |
| /tags/{id}                | PUT    | 更新标签         | 路径参数: `id`(标签ID), 请求体: `{"name":"新标签名称"}` | `{"code":200, "message":"更新成功", "data":{"id":"标签ID", "name":"新标签名称"}}`                            |
| /tags/{id}                | DELETE | 删除标签         | 路径参数: `id`(标签ID)                          | `{"code":200, "message":"删除成功"}`                                                                  |
| /tags/article/{articleId} | GET    | 根据文章ID获取标签列表 | 路径参数: `articleId`(文章ID)                   | `{"code":200, "message":"查询成功", "data":[{"id":"标签ID", "name":"标签名称"}, ...]}`                      |

## 点赞记录管理接口 (LikeRecordController)

| 接口路径         | HTTP方法 | 功能描述        | 请求参数                   | 响应格式                                                          |
| ------------ | ------ | ----------- | ---------------------- | ------------------------------------------------------------- |
| /likes       | POST   | 点赞文章        | `{"articleId":"文章ID"}` | `{"code":200, "message":"点赞成功"}`                              |
| /likes       | DELETE | 取消点赞        | `{"articleId":"文章ID"}` | `{"code":200, "message":"取消点赞成功"}`                            |
| /likes/check | GET    | 检查用户是否已点赞文章 | `articleId`(文章ID)      | `{"code":200, "message":"查询成功", "data":{"liked":true/false}}` |

## 通用响应格式说明

所有接口的响应均采用统一的JSON格式：
{
  "code": 状态码,
  "message": "消息说明",
  "data": 响应数据(可选)
}

## 状态码说明

| 状态码 | 说明        |
| --- | --------- |
| 200 | 操作成功      |
| 400 | 请求参数错误    |
| 401 | 未授权，需要登录  |
| 403 | 拒绝访问，权限不足 |
| 404 | 资源不存在     |
| 500 | 服务器内部错误   |
