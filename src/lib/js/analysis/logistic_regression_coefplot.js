define([
  '../chart/line_chart',
  '../util/utils',
  'ng!$q',
], (lineChart, utils, $q) => {
  return {
    /**
     * createCube - create HyperCubes
     *
     * @param {Object} app    reference to app
     * @param {Object} $scope angular $scope
     *
     * @return {Null} null
     */
     createCube(app, $scope) {
       const layout = $scope.layout;

       // Display loader
       // utils.displayLoader($scope.extId);

       // Set definitions for dimensions and measures
       const dimension = utils.validateDimension(layout.props.dimensions[0]);
       const dimensions = [{
         qNullSuppression: true,
         qDef: {
           qFieldDefs: [dimension]
         },
       }];

       const meaLen = layout.props.measures.length;
       $scope.rowsLabel = ['(Intercept)', (layout.props.measures[1].label != '') ? layout.props.measures[1].label : utils.validateMeasure(layout.props.measures[0]) ]; // Label for dimension values
       let params = `${utils.validateMeasure(layout.props.measures[0])} as mea0, ${utils.validateMeasure(layout.props.measures[1])} as mea1`;
       let meaList = 'mea0 ~ mea1';
       let dataType = 'NN';

       for (let i = 2; i < meaLen; i++) {
         const mea = utils.validateMeasure(layout.props.measures[i]);
         if (mea.length > 0) {
           const param = `,${mea} as mea${i}`;
           params += param;
           meaList += ` + mea${i}`;
           dataType += 'N';

           $scope.rowsLabel.push(utils.validateMeasure(layout.props.measures[i]));
         }
       }

       let calcCoef = 'list(coef(coe)[,1], coef(coe)[,2], coef(coe)[,2])';
       if (layout.props.calcOddsRatio) {
         calcCoef = 'list(exp(coef(coe)[,1]), exp(coef(coe)[,1] - 1.96*coef(coe)[,2]), exp(coef(coe)[,1] + 1.96*coef(coe)[,2]))';
       }

       // Split dataset into training and test datasets
       const splitData = utils.splitData(layout.props.splitDataset, layout.props.splitPercentage, meaLen);

       // Debug mode - set R dataset name to store the q data.
       utils.displayDebugModeMessage(layout.props.debugMode);
       const saveRDataset = utils.getDebugSaveDatasetScript(layout.props.debugMode, 'debug_logistic_regression_coefplot.rda');

       const defMea1 = `R.ScriptEvalExStr('${dataType}','${saveRDataset} library(jsonlite); ${splitData} lm_result <- glm(${meaList}, data=training_data, family=binomial(link="logit")); coe<-summary(lm_result);
       res<-toJSON(${calcCoef});res;',${params})`;

       // Debug mode - display R Scripts to console
       utils.displayRScriptsToConsole(layout.props.debugMode, [defMea1]);

       const measures = [
         {
           qDef: {
             qDef: defMea1,
           },
         },
         {
           qDef: {
             qLabel: '-',
             qDef: '', // Dummy
           },
         },
         {
           qDef: {
             qLabel: '-',
             qDef: '', // Dummy
           },
         },
         {
           qDef: {
             qLabel: '-',
             qDef: '', // Dummy
           },
         },
         {
           qDef: {
             qLabel: '-',
             qDef: '', // Dummy
           },
         },
       ];

       $scope.backendApi.applyPatches([
         {
           qPath: '/qHyperCubeDef/qDimensions',
           qOp: 'replace',
           qValue: JSON.stringify(dimensions),
         },
         {
           qPath: '/qHyperCubeDef/qMeasures',
           qOp: 'replace',
           qValue: JSON.stringify(measures),
         },
       ], false);

       $scope.patchApplied = true;
       return null;
     },
    /**
    * drawChart - draw chart with updated data
    *
    * @param {Object} $scope angular $scope
    *
    * @return {Object} Promise object
    */
    drawChart($scope) {
      const defer = $q.defer();
      const layout = $scope.layout;

      const dimension = utils.validateDimension(layout.props.dimensions[0]);
      const requestPage = [{
        qTop: 0,
        qLeft: 0,
        qWidth: 6,
        qHeight: 1,
      }];

      $scope.backendApi.getData(requestPage).then((dataPages) => {
        const measureInfo = $scope.layout.qHyperCube.qMeasureInfo;

        // Display error when all measures' grand total return NaN.
        if (dataPages[0].qMatrix[0][1].qText.length === 0 || dataPages[0].qMatrix[0][1].qText == '-') {
          utils.displayConnectionError($scope.extId);
        } else {
          // Debug mode - display returned dataset to console
          utils.displayReturnedDatasetToConsole(layout.props.debugMode, dataPages[0]);

          const palette = utils.getDefaultPaletteColor();
          const result = JSON.parse(dataPages[0].qMatrix[0][1].qText);

          const x = [];
          const array = [];
          const arrayminus = [];
          const all = [];

          for (let i = 0; i < result[0].length; i++) {
            x.push(result[0][i]);

            if (layout.props.calcOddsRatio) {
              array.push(result[2][i] - result[0][i]);
              arrayminus.push(result[0][i] - result[1][i]);
              all.push(Math.abs(result[1][i]));
              all.push(Math.abs(result[2][i]));
            } else {
              array.push(result[1][i]);
              arrayminus.push(result[2][i]);
              all.push(Math.abs(result[0][i] - result[1][i]));
              all.push(Math.abs(result[0][i] + result[2][i]));
            }
          }

          const maxVal = Math.max.apply(null, all);

          const chartData = [
            {
              x,
              y: $scope.rowsLabel,
              name: 'Coefficients plot',
              error_x: {
                type: 'data',
                symmetric: false,
                array,
                arrayminus,
                thickness: layout.props.borderWidth,
                color: (layout.props.colors) ? `rgba(${palette[3]},1)` : `rgba(${utils.getConversionRgba(layout.props.colorForMain.color, 1)})`,
              },
              type: 'scatter',
              mode: 'markers',
              marker: {
                color: (layout.props.colors) ? `rgba(${palette[3]},1)` : `rgba(${utils.getConversionRgba(layout.props.colorForMain.color, 1)})`,
                size: layout.props.pointRadius,
              },
            }
          ];

          const customOptions = {
            showlegend: $scope.layout.props.showLegend,
            xaxis: {
              showgrid: $scope.layout.props.xScale,
              side: $scope.layout.props.xAxisPosition,
              range: [(maxVal * 1.1) * -1, (maxVal * 1.1)],
            },
            yaxis: {
              showgrid: $scope.layout.props.yScale,
              side: $scope.layout.props.yAxisPosition,
              autorange: 'reversed',
              range: [-1, ($scope.rowsLabel.length)],
            },
            separators: utils.getSeparators($scope, 0),
            dragmode: 'select',
            margin: {
              r: ($scope.layout.props.yAxisPosition == 'right') ? $scope.layout.props.marginRight + 70 : $scope.layout.props.marginRight,
              l: ($scope.layout.props.yAxisPosition == 'left') ? $scope.layout.props.marginLeft + 70 : $scope.layout.props.marginLeft,
              t: ($scope.layout.props.xAxisPosition == 'top') ? $scope.layout.props.marginTop + 70 : $scope.layout.props.marginTop,
              b: ($scope.layout.props.xAxisPosition == 'bottom') ? $scope.layout.props.marginBottom + 70 : $scope.layout.props.marginBottom,
            },
          };

          // Set HTML element for chart
          $(`.advanced-analytics-toolsets-${$scope.extId}`).html(`<div id="aat-chart-${$scope.extId}" style="width:100%;height:100%;"></div>`);

          lineChart.draw($scope, chartData, `aat-chart-${$scope.extId}`, customOptions);

        }
        return defer.resolve();
      });
      return defer.promise;
    },
  };
});
