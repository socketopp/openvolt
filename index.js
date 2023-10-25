import { config } from 'dotenv';
config();

import { request } from './request.js';

const OPENVOLT_BASE_URL = process.env.OPENVOLT_BASE_URL;
const CARBON_BASE_URL = process.env.CARBON_BASE_URL;

function createTable(data, field) {
  return data.reduce((acc, item) => {
    const key = new Date(item[field]).getTime();
    acc[key] = item;
    return acc;
  }, {});
}

/**
 *  Get interval for smart meter data by meter ID
 * @param {string} meterId - Primary key combinding meter_number and customer_id
 * @param {string} start - Start date
 * @param {string} end - End date
 * @param {string} granularity - How granular to return the data
 * @returns {Promise<any>}
 */
async function getEnergyConsumptionByMeterId({ meterId, start, end, granularity }) {
  const queryParams = new URLSearchParams({
    meter_id: meterId,
    start_date: start,
    end_date: end,
    granularity,
  });

  const intervalUrl = `${OPENVOLT_BASE_URL}/interval-data?${queryParams.toString()}`;
  const intervalData = await request({ method: 'GET', url: intervalUrl });
  return intervalData;
}

/**
 * Get interval national carbon intensity
 * @param {string} from - Start date
 * @param {string} to - End date
 * @returns {Promise<any>}
 */
async function getCarbonIntensity({ from, to }) {
  const carbonUrl = `${CARBON_BASE_URL}/intensity/${from}/${to}`;
  const carbonData = await request({ method: 'GET', url: carbonUrl });
  return carbonData;
}

/**
 * Get intervals for generation mix for the GB power system
 * @param {string} from - Start date
 * @param {string} to - End date
 * @returns {Promise<any>}
 */
async function getGenerationMixByDate({ from, to }) {
  const carbonUrl = `${CARBON_BASE_URL}/generation/${from}/${to}`;
  const carbonData = await request({ method: 'GET', url: carbonUrl });
  return carbonData;
}

async function main() {
  const meterId = '6514167223e3d1424bf82742';
  const openvoltStart = '2023-01-01T00:00:00.000Z';
  const openvoltEnd = '2023-01-31T23:59:59.999Z';
  const carbonIntensityStart = '2023-01-01T00:01Z';
  const carbonIntensityEnd = '2023-02-01T00:00Z';

  const openvoltParams = {
    meterId,
    granularity: 'hh',
    start: openvoltStart,
    end: openvoltEnd,
  };
  const carbonParams = { from: carbonIntensityStart, to: carbonIntensityEnd };

  console.log("Fetching data from API's");
  const [{ data: generationMix }, { data: carbonIntensity }, { data: energyConsumptions }] = await Promise.all([
    getGenerationMixByDate(carbonParams),
    getCarbonIntensity(carbonParams),
    getEnergyConsumptionByMeterId(openvoltParams),
  ]);

  /** Create lookup table so we don't need to do nested loops */
  const generationMixTable = createTable(generationMix, 'from');
  const carbonIntensityTable = createTable(carbonIntensity, 'from');

  /**
   * 24 hours in a day which means there are 48 half-hours in a day.
   * There are 31 days in January.
   * This gives us 31x48 = 1488 half-hours for January 2023.
   */
  const halfhourlyError =
    energyConsumptions.length !== 1488 || carbonIntensity.length !== 1488 || generationMix.length !== 1488;
  if (halfhourlyError) {
    console.log('Half-hourly should be 1488', {
      generationMix: generationMix.length,
      carbonIntensity: carbonIntensity.length,
      energyConsumptions: energyConsumptions.length,
    });
    return;
  }
  let totalEnergyConsumption = 0;
  let totalCO2Emissions = 0;
  let fuelMixAverage = {};

  const { consumption_units } = energyConsumptions[0];

  energyConsumptions.map((house) => {
    const energyDate = new Date(house.start_interval).getTime();
    const fuelMix = generationMixTable[energyDate];
    const carbonIntensity = carbonIntensityTable[energyDate];

    const consumption = +house.consumption;

    if (fuelMix && carbonIntensity) {
      /**
       * Calculate the energy consumption for question 1.
       */
      totalEnergyConsumption += consumption;
      /**
       * Calculate the C02 emissions for question 2
       */
      totalCO2Emissions += (carbonIntensity.intensity.actual / 1000) * consumption;

      /**
       * Calculate the weighted average for the fuel mix that was used for question 3.
       */
      for (const { fuel, perc } of fuelMix.generationmix) {
        if (!fuelMixAverage[fuel]) fuelMixAverage[fuel] = 0;
        fuelMixAverage[fuel] += +perc * consumption;
      }
    }
  });

  const totalFuelMixDistribution = Object.values(fuelMixAverage)
    .reduce((total, fuel) => (total += fuel), 0)
    .toFixed();

  /**
   * toFixed(4) make the total sum 100 %, toFixed(1) makes it 99.9%
   */
  const fuelMixAverageInPerc = Object.entries(fuelMixAverage).reduce((acc, [type, fuel]) => {
    acc[type] = (+((+fuel / +totalFuelMixDistribution) * 100).toFixed(1)).toString() + '%';
    return acc;
  }, {});

  /**
   * Prints out the total percentage which is dependent on the rounding.
   * const totalPerc = Object.values(fuelMixAverageInPerc).reduce((total, fuel) => (total += +fuel), 0);
   */

  console.log(`\nMonthly energy consumed by building is ${totalEnergyConsumption} ${consumption_units}`);
  console.log(`\nThe total amount of C02 (kgs) emitted by building is ${totalCO2Emissions.toFixed()} kgs`);
  console.log(
    '\nThe weighted average in percentage of fuel mix (wind/solar/nuclear/coal/etc) used to generate the electricity for the house',
  );

  console.table(fuelMixAverageInPerc);
}

main();
