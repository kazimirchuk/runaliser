const { promises: fs } = require('fs');
const { READERS_UTILS, READERS } = require('./readers');

const readFile = async (path) => {
  let result = null;

  try {
    const content = await fs.readFile(path, 'utf-8');

    for (const reader of Object.values(READERS)) {
      const readerUtil = READERS_UTILS[reader];

      if (readerUtil.canRead(content)) {
        result = {
          reader,
          ...readerUtil.read(content),
        };

        break;
      }
    }
  } catch (error) {
    console.error(error);
  }

  return result;
};

module.exports = {
  readFile,
};
