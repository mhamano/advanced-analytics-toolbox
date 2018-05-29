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
      $scope.rowsLabel = [utils.validateMeasure(layout.props.measures[0])]; // Label for dimension values
      let params = `${utils.validateMeasure(layout.props.measures[0])} as mea0`;
      let meaList = 'q$mea0';
      let dataType = 'N';

      for (let i = 1; i < meaLen; i++) {
        const mea = utils.validateMeasure(layout.props.measures[i]);
        if (mea.length > 0) {
          const param = `,${mea} as mea${i}`;
          params += param;
          meaList += `,q$mea${i}`;
          dataType += 'N';

          $scope.rowsLabel.push(utils.validateMeasure(layout.props.measures[i]));
        }
      }

      // Debug mode - set R dataset name to store the q data.
      utils.displayDebugModeMessage(layout.props.debugMode);
      const saveRDataset = utils.getDebugSaveDatasetScript(layout.props.debugMode, 'debug_pca_variance.rda');

      const defMea1 = `R.ScriptEvalExStr('${dataType}','${saveRDataset} library(jsonlite); pca_result<-prcomp(data.frame(${meaList}), center = TRUE, scale = TRUE); json<-toJSON(summary(pca_result)$importance); json;',${params})`;

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

          const importance = JSON.parse(dataPages[0].qMatrix[0][1].qText);
          const proportionOfVariance = importance[1];
          const cumulativeProportion = importance[2];

          const dim = [];
          for (let i = 0; i < proportionOfVariance.length; i++) {
            dim.push(`PC${i + 1}`);
          }

          const chartData = [
            {
              x: dim,
              y: proportionOfVariance,
              name: 'Proportion of variance',
              mode: 'lines+markers',
              type: 'bar',
              fill: layout.props.line,
              fillcolor: (layout.props.colors) ? `rgba(${palette[3]},0.3)` : `rgba(${utils.getConversionRgba(layout.props.colorForMain.color, 0.3)})`,
              marker: {
                color: (layout.props.colors) ? `rgba(${palette[3]},1)` : `rgba(${utils.getConversionRgba(layout.props.colorForMain.color, 1)})`,
                size: (layout.props.datapoints) ? layout.props.pointRadius : 1,
              },
              line: {
                width: layout.props.borderWidth,
              },
            },
            {
              x: dim,
              y: cumulativeProportion,
              name: 'Cumulative proportion',
              mode: 'lines+markers',
              fill: layout.props.line,
              fillcolor: (layout.props.colors) ? `rgba(${palette[7]},0.3)` : `rgba(${utils.getConversionRgba(layout.props.colorForSub.color, 0.3)})`,
              marker: {
                color: (layout.props.colors) ? `rgba(${palette[7]},1)` : `rgba(${utils.getConversionRgba(layout.props.colorForSub.color, 1)})`,
                size: (layout.props.datapoints) ? layout.props.pointRadius : 1,
              },
              line: {
                width: layout.props.borderWidth,
              },
            },
          ];

          const customOptions = {
            showlegend: $scope.layout.props.showLegend,
            xaxis: {
              title: $scope.layout.props.xLabelsAndTitle ? 'Principal components' : '',
              showgrid: $scope.layout.props.xScale,
              side: $scope.layout.props.xAxisPosition,
              type: $scope.layout.props.xAxisType,
            },
            yaxis: {
              title: $scope.layout.props.yLabelsAndTitle ? 'Variance' : '',
              showgrid: $scope.layout.props.yScale,
              side: $scope.layout.props.yAxisPosition,
              tickformat: utils.getTickFormat($scope, 0),
              tickprefix: utils.getPrefix($scope, 0),
              ticksuffix: utils.getSuffix($scope, 0),
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
