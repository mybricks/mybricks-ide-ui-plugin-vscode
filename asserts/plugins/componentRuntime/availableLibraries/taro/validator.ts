import type { LibraryValidator, ValidationError } from '../types';

/**
 *  库校验器（占位实现）。
 * 后续可在此处添加库的组件合法性校验、API 用法校验等。
 */
const validator: LibraryValidator = {
  libraryName: '@tarojs/taro',

  validate(_code: string): ValidationError[] {
    return [];
  },
};

export default validator;
