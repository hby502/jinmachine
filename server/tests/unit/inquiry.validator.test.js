/**
 * =============================================================================
 * 留言三层校验 — 单元测试 (Rule 7: 核心业务覆盖率 ≥80%)
 * =============================================================================
 */

const { validateCreateInquiry, validateUpdateStatus, validateListQuery } = require('../../src/validators/inquiry.validator');
const { ParamError } = require('../../src/utils/errors');

describe('留言校验器 — 三层校验', () => {
  // =========================================================================
  // ① 正常流程: 合法参数
  // =========================================================================
  describe('正常流程', () => {
    test('完整合法参数通过三层校验', () => {
      const body = {
        name: '张三',
        phone: '13800138000',
        company: '某某塑料有限公司',
        materialType: 'PET',
        capacity: '300-500',
        message: '需要了解Bluebaby 300kg/h的报价',
      };
      const result = validateCreateInquiry(body);
      expect(result.name).toBe('张三');
      expect(result.phone).toBe('13800138000');
      expect(result.materialType).toBe('PET');
      expect(result.capacity).toBe('300-500');
    });

    test('最小必填字段通过校验', () => {
      const body = { name: '李四', phone: '13900139000', materialType: 'PE' };
      const result = validateCreateInquiry(body);
      expect(result.name).toBe('李四');
      expect(result.capacity).toBe('unknown');  // 默认值
      expect(result.company).toBeNull();
      expect(result.message).toBe('');
    });

    test('模糊字段被剥离', () => {
      const body = { name: '王五', phone: '13700137000', materialType: 'PET', hackerField: 'evil' };
      const result = validateCreateInquiry(body);
      expect(result.hackerField).toBeUndefined();
    });
  });

  // =========================================================================
  // ② 异常流程: 非法参数
  // =========================================================================
  describe('异常流程 — 参数校验', () => {
    test('缺少必填字段 name 抛出 ParamError', () => {
      expect(() => validateCreateInquiry({ phone: '13800138000', materialType: 'PET' }))
        .toThrow(ParamError);
    });

    test('缺少必填字段 phone 抛出 ParamError', () => {
      expect(() => validateCreateInquiry({ name: '张三', materialType: 'PET' }))
        .toThrow(ParamError);
    });

    test('枚举值不合法抛出 ParamError', () => {
      expect(() => validateCreateInquiry({ name: '张三', phone: '13800138000', materialType: 'INVALID_TYPE' }))
        .toThrow(ParamError);
    });

    test('phone 包含非数字字符（除 +-() 和空格）抛出错误', () => {
      expect(() => validateCreateInquiry({ name: '张三', phone: 'abc13800138000', materialType: 'PET' }))
        .toThrow(ParamError);
    });

    test('name 超长抛出 ParamError', () => {
      const longName = 'A'.repeat(51);
      expect(() => validateCreateInquiry({ name: longName, phone: '13800138000', materialType: 'PET' }))
        .toThrow(ParamError);
    });
  });

  // =========================================================================
  // ③ 边界场景: 特殊值
  // =========================================================================
  describe('边界场景', () => {
    test('name 为纯空白抛出 ParamError', () => {
      expect(() => validateCreateInquiry({ name: '   ', phone: '13800138000', materialType: 'PET' }))
        .toThrow(ParamError);
    });

    test('name 包含控制字符抛出 ParamError', () => {
      expect(() => validateCreateInquiry({ name: '张三\x00', phone: '13800138000', materialType: 'PET' }))
        .toThrow(ParamError);
    });

    test('手机号过短（<7位数字）抛出 ParamError', () => {
      expect(() => validateCreateInquiry({ name: '张三', phone: '12345', materialType: 'PET' }))
        .toThrow(ParamError);
    });

    test('phone 格式：带空格和横线的号码通过', () => {
      const result = validateCreateInquiry({ name: '张三', phone: '138 0013 8000', materialType: 'PET' });
      expect(result.phone).toBe('138 0013 8000');
    });

    test('company 空字符串转为 null', () => {
      const result = validateCreateInquiry({ name: '张三', phone: '13800138000', materialType: 'PET', company: '' });
      expect(result.company).toBeNull();
    });

    test('message 超长 2000 字符抛出 ParamError', () => {
      const longMsg = 'A'.repeat(2001);
      expect(() => validateCreateInquiry({ name: '张三', phone: '13800138000', materialType: 'PET', message: longMsg }))
        .toThrow(ParamError);
    });
  });
});

describe('留言状态更新校验', () => {
  test('合法状态通过', () => {
    const result = validateUpdateStatus({ status: 'contacted', notes: '已电话联系' });
    expect(result.status).toBe('contacted');
  });

  test('不允许 new 状态（new 仅创建时使用）', () => {
    expect(() => validateUpdateStatus({ status: 'new' })).toThrow(ParamError);
  });

  test('非法状态抛出 ParamError', () => {
    expect(() => validateUpdateStatus({ status: 'invalid' })).toThrow(ParamError);
  });
});

describe('留言列表查询参数校验', () => {
  test('合法查询参数通过', () => {
    const result = validateListQuery({ page: '2', pageSize: '10', status: 'new' });
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(10);
  });

  test('pageSize 超限 100 抛错', () => {
    expect(() => validateListQuery({ pageSize: '101' })).toThrow(ParamError);
  });
});
