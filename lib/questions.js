const zipcodes = require('zipcodes');

module.exports = [
  {
    type: 'input',
    name: 'unit',
    message: "Do you prefer Celsius(°C) or Fahrenheit(°F)?",
    validate: function(value) {
      const optionA = value.match(/\bc\b/gi);
      const optionB = value.match(/\bcelsius\b/gi);
      const optionC = value.match(/\bf\b/gi);
      const optionD = value.match(/\bfahrenheit\b/gi);
      if (optionA || optionB || optionC || optionD) {
        return true;
      }

      return 'Please enter either C, Celsius, F, or Fahrenheit';
    }
  },
  {
    type: 'input',
    name: 'zipCode',
    message: "Enter a U.S. zip code to see the weather at that location:",
    validate: function(value) {
      if (zipcodes.lookup(value) == 'undefined') {
        return 'Not found. Please enter a valid U.S. zip code: ';
      }

      if (typeof zipcodes.lookup(value) === 'object') {
        if (zipcodes.lookup(value).country == 'Canada') {
          return 'Not found. Please enter a valid U.S. zip code: ';
        }
        return true;
      }

      return 'Not found. Please enter a valid U.S. zip code: ';
    }
  }
];
