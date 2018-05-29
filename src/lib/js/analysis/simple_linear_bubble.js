define([
  '../chart/bubble_chart',
  '../util/utils',
  'ng!$q',
], (bubbleChart, utils, $q) => {
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
      const dimensions = [
        {
          qNullSuppression: true,
          qDef: {
            qFieldDefs: [dimension],
            // qSortCriterias: layout.qHyperCubeDef.qDimensions[0].qDef.qSortCriterias
          },
        },
      ];

      // Debug mode - set R dataset name to store the q data.
      utils.displayDebugModeMessage(layout.props.debugMode);
      const saveRDataset = utils.getDebugSaveDatasetScript(layout.props.debugMode, 'debug_simple_linear_bubble.rda');

      const measure1 = utils.validateMeasure(layout.props.measures[0]);
      const measure2 = utils.validateMeasure(layout.props.measures[1]);

      const defMea1 = `R.ScriptEval('${saveRDataset} lm_result <- lm(q$Measure2~q$Measure1);predict(lm_result, interval="${layout.props.interval}", level=${layout.props.confidenceLevel})[,1]',${measure1} as Measure1, ${measure2} as Measure2)`;
      const defMea2 = `R.ScriptEval('lm_result <- lm(q$Measure2~q$Measure1);predict(lm_result, interval="${layout.props.interval}", level=${layout.props.confidenceLevel})[,2]',${measure1} as Measure1, ${measure2} as Measure2)`;
      const defMea3 = `R.ScriptEval('lm_result <- lm(q$Measure2~q$Measure1);predict(lm_result, interval="${layout.props.interval}", level=${layout.props.confidenceLevel})[,3]',${measure1} as Measure1, ${measure2} as Measure2)`;

      // Debug mode - display R Scripts to console
      utils.displayRScriptsToConsole(layout.props.debugMode, [defMea1, defMea2, defMea3]);

      const measures = [
        {
          qDef: {
            qDef: measure1,
            // qSortBy: layout.qHyperCubeDef.qMeasures[0].qSortBy, // Sort definition
          },
        },
        {
          qDef: {
            qDef: measure2,
            // qSortBy: layout.qHyperCubeDef.qMeasures[1].qSortBy, // Sort definition
          },
        },
        {
          qDef: {
            qLabel: 'Fit',
            qDef: defMea1,
          },
        },
        {
          qDef: {
            qLabel: 'Lower',
            qDef: defMea2,
          },
        },
        {
          qDef: {
            qLabel: 'Upper',
            qDef:  defMea3,
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
    drawChart($scope, app) {
      const defer = $q.defer();
      const layout = $scope.layout;

      const dimension = utils.validateDimension(layout.props.dimensions[0]);
      const requestPage = [{
        qTop: 0,
        qLeft: 0,
        qWidth: 6,
        qHeight: 1500,
      }];

      utils.pageExtensionData($scope, (dataPages) => {
        const measureInfo = $scope.layout.qHyperCube.qMeasureInfo;

        // Display error when all measures' grand total return NaN.
        if (isNaN(measureInfo[2].qMin) && isNaN(measureInfo[2].qMax)
          && isNaN(measureInfo[3].qMin) && isNaN(measureInfo[3].qMax)
          && isNaN(measureInfo[4].qMin) && isNaN(measureInfo[4].qMax)
        ) {
          utils.displayConnectionError($scope.extId);
        } else {
          // Debug mode - display returned dataset to console
          utils.displayReturnedDatasetToConsole(layout.props.debugMode, dataPages);

          const palette = utils.getDefaultPaletteColor();

          const elemNum = [];
          const dim1 = [];
          const mea1 = [];
          const mea2 = [];
          const mea3 = [];
          const mea4 = [];
          const mea5 = [];

          const datasets = dataPages.map((value) => {
            return {
              elemNum: value[0].qElemNumber,
              dim1: value[0].qText,
              mea1: value[1].qNum,
              mea2: value[2].qNum,
              mea3: value[3].qNum,
              mea4: value[4].qNum,
              mea5: value[5].qNum,
            };
          });

          // Sort datasets with mea1 (values for xaxis on bubble chart)
          // When datasets is not sorted, the color fillings between upper and lower
          // line is not done properly.
          datasets.sort((a, b) => {
            return parseFloat(a.mea1) - parseFloat(b.mea1);
          });

          $.each(datasets, (key, value) => {
            elemNum.push(value.elemNum);
            dim1.push(value.dim1);
            mea1.push(value.mea1);
            mea2.push(value.mea2);
            mea3.push(value.mea3);
            mea4.push(value.mea4);
            mea5.push(value.mea5);
          });

          const chartData = [
            {
              x: mea1,
              y: mea2,
              elemNum,
              text: dim1,
              name: dimension,
              mode: 'markers',
              type: 'scatter',
              marker: {
                color: (layout.props.colors) ? `rgba(${palette[3]},0.8)` : `rgba(${utils.getConversionRgba(layout.props.colorForMain.color, 0.8)})`,
                size: layout.props.bubbleSize,
              },
            },
            {
              x: mea1,
              y: mea3,
              name: 'Fit',
              line: {
                color: (layout.props.colors) ? `rgba(${palette[7]}, 1)` : `rgba(${utils.getConversionRgba(layout.props.colorForSub.color, 1)})`,
              },
            },
            {
              x: mea1,
              y: mea4,
              name: 'Lower',
              fill: 'tonexty',
              fillcolor: (layout.props.colors) ? `rgba(${palette[7]},0.3)` : `rgba(${utils.getConversionRgba(layout.props.colorForSub.color, 0.3)})`,
              type: 'scatter',
              mode: 'none',
            },
            {
              x: mea1,
              y: mea5,
              name: 'Upper',
              fill: 'tonexty',
              fillcolor: (layout.props.colors) ? `rgba(${palette[7]},0.3)` : `rgba(${utils.getConversionRgba(layout.props.colorForSub.color, 0.3)})`,
              type: 'scatter',
              mode: 'none',
            },
          ];

          // Set HTML element for chart
          $(`.advanced-analytics-toolsets-${$scope.extId}`).html(`<div id="aat-chart-${$scope.extId}" style="width:100%;height:100%;"></div>`);

          const chart = bubbleChart.draw($scope, app, chartData, `aat-chart-${$scope.extId}`, null);
          bubbleChart.setEvents(chart, $scope, app);
        }
        return defer.resolve();
      });
      return defer.promise;
    },
  };
});
