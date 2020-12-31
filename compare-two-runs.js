const { READERS_PROPERTIES } = require('./readers');

function compareRuns(previousRun, currentRun) {
  function getDifference(previousValue, currentValue) {
    const baselineValue = Math.max(previousValue, currentValue);
    const valueDifference = Math.abs(currentValue - previousValue);

    const differenceInPercentage = (100 * valueDifference) / baselineValue;
    const sign = currentValue > previousValue ? '+' : currentValue < previousValue ? '-' : '';

    return `${sign + differenceInPercentage.toFixed(2)}%`;
  }

  const properties = Object.keys(previousRun.summary);

  const comparisons = [];

  properties.forEach((property) => {
    if (
      typeof previousRun.summary[property] !== 'undefined' &&
      typeof currentRun.summary[property] !== 'undefined'
    ) {
      const difference = getDifference(previousRun.summary[property], currentRun.summary[property]);

      comparisons.push({
        property: READERS_PROPERTIES[property],
        previously: previousRun.summary[property],
        currently: currentRun.summary[property],
        difference,
      });
    }
  });

  return comparisons;
}

module.exports = {
  compareRuns,
};
