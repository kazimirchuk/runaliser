const path = require('path');
const express = require('express');
const hbs = require('hbs');
const multipart = require('connect-multiparty');
const { promises: fs } = require('fs');
const { readFile } = require('./read');
const { compareRuns } = require('./compare-two-runs');

const MAX_FILE_SIZE = 300000;

const blocks = {};

hbs.registerHelper('extend', function (name, context) {
  let block = blocks[name];

  if (!block) {
    blocks[name] = [];
    block = blocks[name];
  }

  block.push(context.fn(this));
});

hbs.registerHelper('block', function (name) {
  const val = (blocks[name] || []).join('\n');

  blocks[name] = [];

  return val;
});

const app = express();
const port = 3000;

app.set('view engine', 'hbs');
app.set('views', `${__dirname}/views`);
app.use('/static', express.static(path.join(__dirname, 'public')));

app.post(
  '/compare-two-runs',
  multipart({
    uploadDir: './files',
  }),
  async function (req, res) {
    const { first_run: firstRunFile, last_run: lastRunFile } = req.files;

    if (!firstRunFile || !lastRunFile || firstRunFile.size === 0 || lastRunFile.size === 0) {
      try {
        await fs.unlink(firstRunFile.path);
        await fs.unlink(lastRunFile.path);
      } catch (error) {
        console.log('Failed to remove uploaded files');
      }
      res.render('two-runs-comparison-error', {
        title: 'Runaliser',
        message:
          'Either 1 or 2 files were not uploaded. Please go to the home page and try again but this time choose both files.',
      });

      return;
    }

    if (firstRunFile.type !== 'text/csv' || lastRunFile.type !== 'text/csv') {
      try {
        await fs.unlink(firstRunFile.path);
        await fs.unlink(lastRunFile.path);
      } catch (error) {
        console.log('Failed to remove uploaded files');
      }
      res.render('two-runs-comparison-error', {
        title: 'Runaliser',
        message: 'Uploaded files aren\t CSVs. Please, upload CSV files only',
      });

      return;
    }

    if (firstRunFile.size === MAX_FILE_SIZE || lastRunFile.size === MAX_FILE_SIZE) {
      try {
        await fs.unlink(firstRunFile.path);
        await fs.unlink(lastRunFile.path);
      } catch (error) {
        console.log('Failed to remove uploaded files');
      }
      res.render('two-runs-comparison-error', {
        title: 'Runaliser',
        message: "Size of your files is too big, are you sure that's supposed to be like that?",
      });

      return;
    }

    const firstRun = await readFile(firstRunFile.path);
    const lastRun = await readFile(lastRunFile.path);

    if (!firstRun || !lastRun) {
      res.render('two-runs-comparison-error', {
        title: 'Runaliser',
        message: "Couldn't read contents of your files.",
      });

      return;
    }

    if (firstRun.reader !== lastRun.reader) {
      res.render('two-runs-comparison-error', {
        title: 'Runaliser',
        message:
          "Your files aren't of the same format. It's hard to compare them this way. Please, upload files of the same format.",
      });

      return;
    }

    const comparisons = compareRuns(firstRun, lastRun);

    try {
      await fs.unlink(firstRunFile.path);
      await fs.unlink(lastRunFile.path);
    } catch (error) {
      console.log('Failed to remove uploaded files');
    }

    res.render('two-runs-comparison', {
      title: 'Runaliser',
      comparisons: comparisons.map((c) => ({
        ...c,
        difference_class:
          c.difference[0] === '+'
            ? 'text-success'
            : c.difference[0] === '-'
            ? 'text-danger'
            : 'text-warning',
      })),
    });
  }
);

app.get('/privacy', function (_req, res) {
  res.render('privacy', {
    title: 'Privacy',
  });
});

app.get('/terms', function (_req, res) {
  res.render('terms', {
    title: 'Terms',
  });
});

app.get('/', function (_req, res) {
  res.render('index', {
    title: 'Runaliser',
  });
});

app.listen(port, () => {
  console.log(`Runaliser app listening at http://localhost:${port}`);
});
