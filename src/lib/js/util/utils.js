define([
  '../../vendor/numeral.min'
], (numeral) => {
  return {

    /**
     * displayLoader - Display loader circle
     *
     * @param {String} extId extension ID
     *
     */
    displayLoader(extId){
        $(`.advanced-analytics-toolsets-${extId}`).html(`
          <div style="height:100%; width:100%">
            <p style="position:relative;top:38%" class="qui-pleasewaitdialog-loader-container">
              <img src="../resources/img/core/loader.svg"/>
            </p>
          </div>`);
    },

    /**
     * displayConnectionError - Display connection error
     *
     * @param {type} extId extension ID
     *
     */
    displayConnectionError(extId) {
      $(`.advanced-analytics-toolsets-${extId}`).html('<div class="requirements-wrapper incomplete"><div class="requirements"><p class="incomplete-text">Error occured when retrieveing data from R.</p></div></div>');
    },

    /**
     * getDefaultPaletteColor - Return an array of Qlik Sense default 12 colors
     *
     * @return {Object} Array of Qlik Sense default 12 colors
     */
    getDefaultPaletteColor() {
      return ['176,175,174', '123,122,120', '84,83,82', '68,119,170', '125,184,218', '182,215,234', '70,198,70', '249,63,23', '255,207,2', '39,110,39', '255,255,255', '0,0,0'];
    },
    /**
     * getDefaultPaletteColor - Return an array of Qlik Sense 12 colors
     *
     * @return {Object} Array of Qlik Sense 12 colors
     */
    getTwelveColors() {
      return ['51,34,136', '102,153,204', '136,204,238', '68,170,153', '17,119,51', '153,153,51', '221,204,119', '102,17,0', '204,102,119', '170,68,102', '136,34,85', '170,68,153'];
    },
    /**
     * getDefaultPaletteColor - Return an array of Qlik Sense 100 colors
     *
     * @return {Object} Array of Qlik Sense  100 colors
     */
    getOneHundredColors() {
      return ['153,200,103', '228,60,208', '226,64,42', '102,168,219', '63,26,32', '229,170,135', '60,107,89', '170,42,107', '233,176,46', '120,100,221', '101,233,60', '92,228,186', '208,224,218', '215,150,22',
        '100,72,123', '228,231,43', '111,115,48', '147,40,52', '174,108,125', '152,103,23', '227,203,112', '64,140,29', '221,50,95', '83,61,28', '42,60,84', '219,113,39', '114,227,226', '226,193,218',
        '212,117,85', '125,127,129', '84,174,155', '233,218,166', '58,136,85', '91,230,110', '171,57,164', '166,227,50', '108,70,157', '227,158,81', '79,28,66', '39,60,28', '170,151,46', '139,179,42',
        '189,236,165', '99,236,155', '156,53,25', '170,164,132', '114,37,109', '77,116,159', '152,132,223', '229,144,184', '68,182,43', '173,87,146', '198,93,234', '230,112,202', '227,135,131', '41,49,45',
        '106,44,30', '215,177,170', '177,231,195', '205,193,52', '158,231,100', '86,184,206', '44,99,35', '101,70,74', '177,207,234', '60,116,129', '58,78,150', '100,147,225', '219,86,86', '116,114,89',
        '187,171,228', '227,63,146', '208,96,125', '117,159,121', '157,107,94', '133,116,174', '126,48,76', '173,143,172', '75,119,222', '100,126,23', '185,195,121', '141,168,176', '185,114,217', '120,98,121',
        '126,192,125', '145,100,54', '45,39,79', '220,230,128', '117,151,72', '218,230,90', '69,156,73', '183,147,74', '81,198,113', '158,173,63', '150,154,92', '185,151,106', '70,83,26', '192,240,132',
        '118,193,70', '186,208,173'];
    },
    /**
     * setLocaleInfo - Set locale infomation to angular $scope
     *
     * @param {Object} $scope angular $scope
     * @param {Object} app    reference to app
     *
     */
    setLocaleInfo($scope, app) {
      $scope.localeInfo = [];
      app.getAppLayout((layout) => {
        const localeInfo = layout.qLocaleInfo;

        $scope.localeInfo.thousandSep = localeInfo.qThousandSep;
        $scope.localeInfo.decimalSep = localeInfo.qDecimalSep;
        $scope.localeInfo.moneyFmt = localeInfo.qMoneyFmt;
        $scope.localeInfo.moneyThousandSep = localeInfo.qMoneyThousandSep;
        $scope.localeInfo.dateFmt = localeInfo.qDateFmt;
      });
    },

    /**
     * validateDimension - Recieve dimension object and return field value
     *
     * @param {Object} dimension Dimension data (layout.props.dimensions[i])
     *
     * @return {String} Dimension field value
     */
    validateDimension(dimension) {
      // Set definitions for dimensions and measures. When qStringExpression.qExpr is defined, it is used as a dimension expression.
      var result = (typeof dimension.expression.qStringExpression != 'undefined') ? dimension.expression.qStringExpression.qExpr : dimension.expression;

      // When dimension expression does not include space and blanketd with [], replace [].
      if (!/\s/.test(result) && /^\[.*]$/.test(result)) {
        result = result.slice(1, -1);
      }

      return result;
    },
    /**
     * validateMeasure - Recieve measure object and return measure expression value
     *
     * @param {Object} measure Measure data (layout.props.measures[i])
     *
     * @return {String} Measure expression value
     */
    validateMeasure(measure) {
      // Set definitions for dimensions and measures. When qStringExpression.qExpr is defined, it is used as a dimension expression.
      var result = (typeof measure.expression.qStringExpression != 'undefined') ? measure.expression.qStringExpression.qExpr : measure.expression;

      // When dimension expression does not include space and blanketd with [], replace [].
      if (!/\s/.test(result) && /^\[.*]$/.test(result)) {
        result = result.slice(1, -1);
      }

      return result;
    },

    /**
     * format - Format number data using numeral.js
     *
     * @param {Number} number number value
     * @param {String} format number format string
     *
     * @return {Number} Formatted number value
     */
    format(number, format) {
      return numeral(number).format(format);
    },

    /**
     * getTickFormat - Retrieve number format settings from a measure and return number format string
     *
     * @param {Object} $scope    angular $scope
     * @param {Number} measureId Measure ID
     *
     * @return {String} Number format string
     */
    getTickFormat($scope, measureId) {
      let result = '';
      const layout = $scope.layout;
      const measure = layout.props.measures[measureId];
      const numberFormatting = layout.props.measures[measureId].numberFormatting;

      // Number formatting = Auto
      if (typeof numberFormatting == 'undefined' || numberFormatting == '0') {
        result = '';
      // Number formatting = Number
      } else if (numberFormatting == '1') {
        // Formatting = Simple
        if (typeof measure.formatting == 'undefined' || measure.formatting == true) {
          switch (measure.numberFormattingSimple) {
            // Number formatting
            case 0: // 1,000
              result = ',.0f';
              break;
            case 1: // 1,000.1
              result = ',.1f';
              break;
            case 2: // 1,000.12
              result = ',.2f';
              break;
            case 3: // 12%
              result = '.0%';
              break;
            case 4: // 12.1%
              result = '.1%';
              break;
            case 5: // 12.12%
              result = '.2%';
              break;
            default:
              result = ',.2f';
              break;
          }
        // Formatting = Custom
        } else {
          result = measure.numberFormatPattern;
        }
      // Number formatting = Money
      } else if (numberFormatting == '2') {
        result = (typeof measure.moneyFormatPattern == 'undefined') ? ',.2f' : measure.moneyFormatPattern;
      // Number formatting = Custom
      } else if (numberFormatting == '5') {
        result = (typeof measure.customFormatPattern == 'undefined') ? ',.2f' : measure.customFormatPattern;
      } else {
        result = '';
      }
      return result;
    },

    /**
     * getSeparators - Get and return separators value from the locale setting
     *
     * @param {Object} $scope    angular $scope
     * @param {Number} measureId Measure ID
     *
     * @return {String} Combination of decimal separator and thousand separator
     */
    getSeparators($scope, measureId) {
      const layout = $scope.layout;
      const measure = layout.props.measures[measureId];
      let result = '';
      result = $scope.localeInfo.decimalSep + $scope.localeInfo.thousandSep;
      return result;
    },

    /**
     * getPrefix - Return currency symbol as a prefix
     *
     * @param {Object} $scope    angular $scope
     * @param {Number} measureId Measure ID
     *
     * @return {String} Currency symbol
     */
    getPrefix($scope, measureId) {
      const layout = $scope.layout;
      const measure = layout.props.measures[measureId];
      const numberFormatting = layout.props.measures[measureId].numberFormatting;
      let result = '';

      // Return $ when customCurrency value is not set
      if (numberFormatting == '2' && (typeof measure.prefixSuffix == 'undefined' || measure.prefixSuffix == 'prefix')) {
        result = (typeof measure.customCurrency == 'undefined') ? '$' : measure.customCurrency;
      }
      return result;
    },
    /**
     * getSuffix - Return currency symbol as a suffix
     *
     * @param {Object} $scope    angular $scope
     * @param {Number} measureId Measure ID
     *
     * @return {String} Currency symbol
     */
    getSuffix($scope, measureId) {
      const layout = $scope.layout;
      const measure = layout.props.measures[measureId];
      const numberFormatting = layout.props.measures[measureId].numberFormatting;
      let result = '';

      // Return $ when customCurrency value is not set
      if (numberFormatting == '2' && measure.prefixSuffix == 'suffix') {
        result = (typeof measure.customCurrency == 'undefined') ? '$' : measure.customCurrency;
      }
      return result;
    },
  };
});
