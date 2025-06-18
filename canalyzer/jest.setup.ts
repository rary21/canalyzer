import '@testing-library/jest-dom';

// React 18のact()警告を抑制
// テストはすべて通っているが、非同期状態更新の警告を抑制する
const originalError = console.error;
console.error = (...args: unknown[]) => {
  const message = args[0];
  if (
    typeof message === 'string' &&
    message.includes('An update to') &&
    message.includes('inside a test was not wrapped in act')
  ) {
    return; // act警告を抑制
  }
  originalError.call(console, ...args);
};
