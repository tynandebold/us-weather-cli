const argv = require('yargs').string('zip').argv;
const fetch = require('node-fetch');
const emoji = require('node-emoji')
const colors = require('colors');
const moment = require('moment');
const inquirer = require('inquirer');
const questions = require('./questions');

let unit;
let zipCode;

function start() {
	inquirer.prompt(questions).then(answers => {
		if (answers.unit === 'Fahrenheit' || answers.unit === 'fahrenheit' || answers.unit === 'f' || answers.unit === 'F') {
			unit = 'F';
		} else {
			unit = 'C';
		}

		zipCode = answers.zipCode;

		init();
	});
}

async function init() {
  const coordinates = await getLatLongFromZip();
  const woeid = await getWoeid(coordinates); // woeid = Where On Earth ID
  const weatherData = await getWeatherData(woeid);

  writeWeatherData(weatherData);
}

async function getLatLongFromZip() {
  const url = `https://api.zippopotam.us/us/${zipCode}`;
  const response = await fetch(url);
  const json = await response.json();
  const location = json.places[0];

  return `${location.latitude},${location.longitude}`;
}

async function getWoeid(coordinates) {
  const url = `https://www.metaweather.com/api/location/search/?lattlong=${coordinates}`;
  const response = await fetch(url);
  const json = await response.json();

  return json[0].woeid;
}

async function getWeatherData(woeid) {
  const url = `https://www.metaweather.com/api/location/${woeid}/`;
  const response = await fetch(url);

  return await response.json();
}

function writeWeatherData(weatherData) {
  const dayNum = moment(weatherData.time).format('Do');
  const dayName = moment(weatherData.time).format('dddd');
  const month = moment(weatherData.time).format('MMMM');
  const year = moment(weatherData.time).format('YYYY');
  const hour = +moment(weatherData.time).format('k');
  let greeting;

  if (hour < 12) greeting = 'morning';
  if (hour >= 12 && hour < 18) greeting = 'afternoon';
  if (hour >= 18) greeting = 'evening';

  const todaysWeather = buildTodaysData(weatherData.consolidated_weather[0]);
  const forecastData = buildForecastData(weatherData);

  console.log('');
  console.log(`Good ${greeting}, user. Today is ${dayName}, the ${dayNum} of ${month}. The year is ${year}.` .blue);
  console.log('');
  console.log('Here\'s today\'s weather for '.blue + `${weatherData.title}, ${weatherData.parent.title}:`.bold.magenta);
  console.log('');
  console.log(`Current weather: ${todaysWeather.weather_state_name} ` .blue + lookUpIcon(todaysWeather.weather_state_abbr));
  console.log(`Current temp:    ${todaysWeather.the_temp}°${unit}` .blue);
  console.log(`High and low:    ${todaysWeather.max_temp}°${unit} / ${todaysWeather.min_temp}°${unit}` .blue);
  console.log(`Wind:            ${todaysWeather.wind_speed}mph from the ${todaysWeather.wind_direction_compass}` .blue);
  console.log('');
  console.log('5-day forecast:'.cyan.bold);
  console.log('');
  for (let i = 0; i < forecastData.length; i++) {
    console.log('- ' + moment(forecastData[i].applicable_date).format('MMMM D') .blue);
    console.log('  ' + forecastData[i].weather_state_name .blue + ' ' + lookUpIcon(forecastData[i].weather_state_abbr));
    console.log('  ' + `Temp: ${forecastData[i].max_temp}°${unit} / ${forecastData[i].min_temp}°${unit}` .blue);
    console.log('');
  }
  console.log('Thank you for reading.' .blue);
  console.log('');
}

function buildTodaysData(todaysWeather) {
  const weather = {
    the_temp: Math.round(convertTemp(todaysWeather.the_temp)),
    max_temp: Math.round(convertTemp(todaysWeather.max_temp)),
    min_temp: Math.round(convertTemp(todaysWeather.min_temp)),
    wind_speed: Math.round(todaysWeather.wind_speed),
    wind_direction_compass: todaysWeather.wind_direction_compass,
    weather_state_name: todaysWeather.weather_state_name,
    weather_state_abbr: todaysWeather.weather_state_abbr
  };

  return weather;
}

function buildForecastData(weatherData) {
  const ogData = weatherData.consolidated_weather;
  const forecastData = ogData
    .slice(1, ogData.length)
    .map(forecast => {
      return {
        min_temp: Math.round(convertTemp(forecast.min_temp)),
        max_temp: Math.round(convertTemp(forecast.max_temp)),
        weather_state_name: forecast.weather_state_name,
        weather_state_abbr: forecast.weather_state_abbr,
        applicable_date: forecast.applicable_date
      }
    });

  return forecastData;
}

function lookUpIcon(input){
  const dictionary = {
    sn: emoji.get('snowflake'),
    sl: emoji.get('snow_cloud'),
    h: emoji.get('snow_cloud'),
    t: emoji.get('lightning'),
    hr: emoji.get('rain_cloud'),
    lr: emoji.get('rain_cloud'),
    s: emoji.get('partly_sunny_rain'),
    hc: emoji.get('cloud'),
    lc: emoji.get('sun_small_cloud'),
    c: emoji.get('sunny')
  };

  return dictionary[input];
}

function convertTemp(temp) {
  if (unit === 'F') {
    return ((temp * 1.8) + 32);
  } else {
    return temp;
  }
}

exports.start = start;