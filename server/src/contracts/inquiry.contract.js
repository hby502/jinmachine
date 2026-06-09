/**
 * =============================================================================
 * 接口合同: 客户留言/询盘
 * =============================================================================
 */

const inquiryContract = {
  // POST /api/v1/inquiries — 客户提交留言（公开接口）
  create: {
    method: 'POST',
    path: '/api/v1/inquiries',
    auth: false,
    idempotent: true,
    description: '网站访客提交在线留言/产品询盘',
    rateLimit: { windowMs: 60000, max: 5 }, // 防刷：1分钟5次

    body: {
      name: { type: 'string', required: true, minLength: 1, maxLength: 50, source: 'body', example: '张三' },
      phone: { type: 'string', required: true, maxLength: 20, source: 'body', example: '13800138000' },
      company: { type: 'string', required: false, maxLength: 100, source: 'body', default: null, example: '某某塑料有限公司' },
      materialType: { type: 'enum', required: true, enum: ['PET','R-PET','TPU','PE','PA','PLA','PBAT','PMMA','other'], source: 'body', example: 'PET' },
      capacity: { type: 'enum', required: false, enum: ['100-300','300-500','500-800','800+','unknown'], source: 'body', default: 'unknown', example: '300-500' },
      message: { type: 'string', required: false, maxLength: 2000, source: 'body', default: '', example: '需要了解Bluebaby 300kg/h的报价' },
    },

    success: {
      httpStatus: 201,
      example: {
        code: 'SUCCESS',
        message: '留言已提交，我们将尽快联系您！',
        data: { id: 'uuid', name: '张三', createdAt: 'ISO8601' },
      },
    },

    errors: {
      PARAM_ERROR: { httpStatus: 400, code: 'PARAM_ERROR', message: '请填写完整的联系信息' },
      RATE_LIMITED: { httpStatus: 429, code: 'BIZ_30004', message: '提交过于频繁，请稍后再试' },
    },
  },

  // GET /api/v1/inquiries — 管理员查询留言列表（需认证）
  list: {
    method: 'GET',
    path: '/api/v1/inquiries',
    auth: true,
    permissions: ['inquiry:read'],
    description: '分页查询留言列表，支持按状态/物料类型/日期筛选',

    query: {
      page: { type: 'integer', required: false, default: 1, min: 1, source: 'query' },
      pageSize: { type: 'integer', required: false, default: 20, min: 1, max: 100, source: 'query' },
      status: { type: 'enum', required: false, enum: ['new','contacted','quoted','negotiating','won','lost','archived'], source: 'query' },
      materialType: { type: 'string', required: false, source: 'query' },
      startDate: { type: 'string', required: false, format: 'YYYY-MM-DD', source: 'query' },
      endDate: { type: 'string', required: false, format: 'YYYY-MM-DD', source: 'query' },
      keyword: { type: 'string', required: false, maxLength: 100, source: 'query' },
      sortBy: { type: 'enum', required: false, default: 'created_at', enum: ['created_at','name','status'], source: 'query' },
      sortOrder: { type: 'enum', required: false, default: 'DESC', enum: ['ASC','DESC'], source: 'query' },
    },

    success: {
      httpStatus: 200,
      example: {
        code: 'SUCCESS',
        message: '操作成功',
        data: {
          list: [{ id: 'uuid', name: '张三', phone: '138****8000', company: '某某塑料有限公司', materialType: 'PET', status: 'new', createdAt: 'ISO8601' }],
          pagination: { page: 1, pageSize: 20, total: 156, totalPages: 8 },
        },
      },
    },
  },

  // GET /api/v1/inquiries/:id — 查看留言详情
  detail: {
    method: 'GET',
    path: '/api/v1/inquiries/:id',
    auth: true,
    permissions: ['inquiry:read'],

    params: {
      id: { type: 'string', required: true, format: 'UUID v4', source: 'path' },
    },

    success: {
      httpStatus: 200,
      example: {
        code: 'SUCCESS',
        message: '操作成功',
        data: { id: 'uuid', name: '张三', phone: '13800138000', company: '某某塑料有限公司', materialType: 'PET', capacity: '300-500', message: '...', status: 'new', notes: null, createdAt: 'ISO8601', updatedAt: 'ISO8601' },
      },
    },
  },

  // PUT /api/v1/inquiries/:id/status — 更新留言状态
  updateStatus: {
    method: 'PUT',
    path: '/api/v1/inquiries/:id/status',
    auth: true,
    permissions: ['inquiry:update'],

    params: { id: { type: 'string', required: true, format: 'UUID v4', source: 'path' } },
    body: {
      status: { type: 'enum', required: true, enum: ['contacted','quoted','negotiating','won','lost','archived'], source: 'body' },
      notes: { type: 'string', required: false, maxLength: 1000, source: 'body', default: '' },
    },

    success: {
      httpStatus: 200,
      example: { code: 'SUCCESS', message: '状态更新成功', data: { id: 'uuid', status: 'contacted' } },
    },
  },

  // DELETE /api/v1/inquiries/:id — 删除留言（仅超管）
  delete: {
    method: 'DELETE',
    path: '/api/v1/inquiries/:id',
    auth: true,
    permissions: ['inquiry:delete'],

    params: { id: { type: 'string', required: true, format: 'UUID v4', source: 'path' } },

    success: {
      httpStatus: 200,
      example: { code: 'SUCCESS', message: '删除成功', data: null },
    },
  },
};

module.exports = inquiryContract;
