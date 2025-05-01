require('./node_modules/@rushstack/eslint-config/patch/modern-module-resolution');

module.exports = {
  extends: ['./node_modules/@rushstack/eslint-config/profile/node'],
  parserOptions: { tsconfigRootDir: __dirname },
};
