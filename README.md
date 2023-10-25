# Openvolt Building Energy Analysis

This repository contains a program written in JavaScript to perform an analysis of energy consumption, carbon emissions, and the fuel mix used to generate electricity for a commercial building in the UK during the month of January 2023. This program fetches data from external data sources and calculates the required metrics based on half-hourly readings.

## Assignment Overview

The goal of this assignment is to calculate the following for the Stark Industries UK HQ building during January 2023:

1. The monthly energy consumed by the building (in kWh).
2. The amount of CO2 emissions (in kilograms) emitted by the electricity generated for the building.
3. The percentage of the fuel mix (wind/solar/nuclear/coal, etc.) used to generate the electricity.

## Prerequisites

Before running the program, ensure that you have the following set up:

- Node.js: You need Node.js installed on your system to run this program.

## Installation

**1. Clone the repository to your local machine:**

```bash
git clone https://github.com/socketopp/openvolt.git
```

**2. Change into the project directory:**

```bash
cd openvolt
```

**3. Install the required dependencies:**

```bash
npm install
```

## Usage

To run the program and perform the analysis, follow these steps:

**1. Configure Environment Variables:**
Create a .env file in the project directory and set the following environment variables:

```makefile
OPENVOLT_BASE_URL=URL_TO_OPENVOLT_BASE_URL
OPENVOLT_API_KEY=URL_TO_API_KEY
CARBON_BASE_URL=URL_TO_CARBON_BASE_URL
```

Replace URL_TO_CARBON_BASE_URL, URL_TO_OPENVOLT_BASE_URL and URL_TO_API_KEY with the actual API endpoints you have access to.

**2. Execute the Program:**

```bash
npm run dev
```

**3. View the Results:**
The program will fetch data from the specified APIs, calculate the required metrics, and display the results in the console.

## Output

The program will provide the following information in the console:

- Monthly energy consumed by the building (in kWh).
- Total amount of CO2 emissions (in kilograms) emitted by the electricity generated for the building.
- The weighted average in percentage of the fuel mix (wind/solar/nuclear/coal, etc.) used to generate electricity for the building.

## Data Sources

This program relies on external data sources from [carbonintensity.org.uk](https://carbonintensity.org.uk/) to fetch half-hourly readings for carbon intensity, and generation mix and the energy consumption from openvolt [openvolt.com](https://www.openvolt.com/).

## Notes, comments & remarks

- The program uses the dotenv library for managing environment variables.
- Make sure to replace the placeholder URLs in the .env file with the actual API endpoints.
- The monthly energy consumed by the building (kWh) should rephrase to monthly electricity, in the scope of the assignment (no direct heating or cooling).
- 14 day limit is not enforced on GET https://api.carbonintensity.org.uk/intensity/from/to
- Dates with both API don't give correct number of half-hours given that January have 31 days and it's 48 half-hours in a day.
- Openvolt's API endpoint for GET https://api.openvolt.com/v1/interval-data, when used to summarize the consumption for January have discrepancy when using different granularities. such as day, hh and month.
- A bit unclear if question 3 require you to use carbon intensity factor to do the calculation, then it would look something like this:
  Weighted Average Carbon Intensity for Fuel Type (kg CO2/kWh) = (Σ (Carbon Intensity Factor \* Energy Consumption for Each Interval for Fuel Type)) / (Total Energy Consumption for Fuel Type)
