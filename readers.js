const parse = require('csv-parse/lib/sync');

const READERS = {
  POLAR: 'polar',
  GARMIN: 'garmin',
};

const READERS_FIRST_LINE = {
  polar:
    'Name,Sport,Date,Start time,Duration,Total distance (km),Average heart rate (bpm),Average speed (km/h),Max speed (km/h),Average pace (min/km),Max pace (min/km),Calories,Fat percentage of calories(%),Average cadence (rpm),Average stride length (cm),Running index,Training load,Ascent (m),Descent (m),Average power (W),Max power (W),Notes,Height (cm),Weight (kg),HR max,HR sit,VO2max,',
  garmin:
    '"Laps","Time","Cumulative Time","Distance","Avg Pace","Avg HR","Max HR","Avg Run Cadence","Avg Stride Length","Calories","Best Pace","Max Run Cadence","Avg Moving Pace"',
};

const READERS_PROPERTIES = {
  avg_hr: 'Average heart rate (bpm)',
  avg_speed: 'Average speed (km/h)',
  calories: 'Calories',
  fat_part: 'Fat percentage of calories(%)',
  cadence: 'Average cadence (rpm)',
  speed_to_hr: 'Speed to HR ratio',
};

const READ_RESULT_MAPPERS = {
  polar: {
    getFormattedResult(rawResult) {
      return {
        summary: {
          avg_hr: Number(rawResult.summary['Average heart rate (bpm)']),
          avg_speed: Number(rawResult.summary['Average speed (km/h)']),
          calories: Number(rawResult.summary.Calories),
          cadence: Number(rawResult.summary['Average cadence (rpm)']),
        },
        content: rawResult.content,
      };
    },
    extendProperties(formattedResult) {
      return {
        summary: {
          ...formattedResult.summary,
          speed_to_hr: (
            (formattedResult.summary.avg_speed / formattedResult.summary.avg_hr) *
            100
          ).toFixed(2),
        },
        content: formattedResult.content,
      };
    },
  },
  garmin: {
    getFormattedResult(rawResult) {
      const convertPaceToSpeed = (pace) => {
        const [minutes, seconds] = pace.split(':').map((p) => Number(p));

        return (60 / minutes + seconds / 60).toFixed(2);
      };

      return {
        summary: {
          avg_hr: Number(rawResult.summary['Avg HR']),
          avg_speed: convertPaceToSpeed(rawResult.summary['Avg Pace']),
          calories: Number(rawResult.summary.Calories),
          cadence: Number(rawResult.summary['Avg Run Cadence']),
        },
        content: rawResult.content,
      };
    },
    extendProperties(formattedResult) {
      return {
        summary: {
          ...formattedResult.summary,
          speed_to_hr: (
            (formattedResult.summary.avg_speed / formattedResult.summary.avg_hr) *
            100
          ).toFixed(2),
        },
        content: formattedResult.content,
      };
    },
  },
};

const READERS_UTILS = {
  polar: {
    read(content) {
      const lineByLine = content.split('\n');
      const summary = `${lineByLine.shift()}\n${lineByLine.shift()}`;

      const result = {
        summary: parse(summary, {
          columns: true,
          skip_empty_lines: true,
        }).pop(),
        content: parse(lineByLine.join('\n'), {
          columns: true,
          skip_empty_lines: true,
        }),
      };

      const formattedResult = READ_RESULT_MAPPERS[READERS.POLAR].getFormattedResult(result);

      return READ_RESULT_MAPPERS[READERS.POLAR].extendProperties(formattedResult);
    },
    canRead(content) {
      return content.split('\n').shift() === READERS_FIRST_LINE[READERS.POLAR];
    },
  },
  garmin: {
    read(content) {
      const lineByLine = content.split('\n');
      const summary = `${lineByLine.shift()}\n${lineByLine.pop()}`;

      const result = {
        summary: parse(summary, {
          columns: true,
          skip_empty_lines: true,
        }).pop(),
        content: null,
      };

      const formattedResult = READ_RESULT_MAPPERS[READERS.GARMIN].getFormattedResult(result);

      return READ_RESULT_MAPPERS[READERS.GARMIN].extendProperties(formattedResult);
    },
    canRead(content) {
      let firstLine = content.split('\n').shift().split('');

      // removing last character
      firstLine.pop();

      firstLine = firstLine.join('');

      return firstLine === READERS_FIRST_LINE[READERS.GARMIN];
    },
  },
};

module.exports = {
  READERS,
  READERS_UTILS,
  READERS_PROPERTIES,
};
