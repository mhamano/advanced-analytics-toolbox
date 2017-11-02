define([
  '../chart/line_chart',
  '../util/utils',
  'ng!$q',
], (chartDrawer, utils, $q) => {
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
      const dimension0 = utils.validateDimension(layout.props.dimensions[0]);
      const dimension1 = utils.validateDimension(layout.props.dimensions[1]);
      const dimensions = [{
        qNullSuppression: true,
        qDef: {
          qFieldDefs: [dimension0]
        },
      },
      {
        qNullSuppression: true,
        qDef: {
          qFieldDefs: [dimension1]
        },
      }];

      // Set definitions for dimensions and measures
      const params = `${utils.validateMeasure(layout.props.measures[0])} as mea0, ${utils.validateDimension(layout.props.dimensions[1])} as dim1`;
      const meaList = 'q$mea0 ~ q$dim1';
      $scope.dataTitle = utils.validateDimension(layout.props.dimensions[1]);

      // Set first and seasonal differences to acf and pacf
      const dataType = 'NS';

      // Debug mode - set R dataset name to store the q data.
      utils.displayDebugModeMessage(layout.props.debugMode);
      const saveRDataset = utils.getDebugSaveDatasetScript(layout.props.debugMode, 'debug_tukey.rda');

      const defMea1 = `R.ScriptEvalExStr('${dataType}','${saveRDataset} library(jsonlite); res<-TukeyHSD(aov(${meaList}), conf.level=${layout.props.confidenceLevel}); json<-toJSON(list(rownames(res[[1]]), res[[1]])); json;', ${params})`;

      // Debug mode - display R Scripts to console
      utils.displayRScriptsToConsole(layout.props.debugMode, [defMea1]);

      const measures = [
        {
          qDef: {
            qLabel: 'Results',
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

      const dimension = utils.validateDimension(layout.props.dimensions[1]);
      const requestPage = [{
        qTop: 0,
        qLeft: 0,
        qWidth: 6,
        qHeight: 1,
      }];

      $scope.backendApi.getData(requestPage).then((dataPages) => {
        const measureInfo = $scope.layout.qHyperCube.qMeasureInfo;

        // Display error when all measures' grand total return NaN.
        if (dataPages[0].qMatrix[0][2].qText.length === 0 || dataPages[0].qMatrix[0][2].qText == '-') {
          utils.displayConnectionError($scope.extId);
        } else {
          // Debug mode - display returned dataset to console
          utils.displayReturnedDatasetToConsole(layout.props.debugMode, dataPages[0]);

          const result = JSON.parse(dataPages[0].qMatrix[0][2].qText);

          const rownames = result[0];
          const data = result[1];

          let html = `
            <h2>Tukey multiple comparisons of means</h2>
            <div>${layout.props.confidenceLevel * 100}% family-wise confidence level</div>
            <table class="simple">
              <thead>
                <tr>
                  </th><th><th>diff</th><th>lwr</th><th>upr</th><th>p adj</th>
                </tr>
              </thead>
              <tbody>
         `;

          for (let i = 0; i < rownames.length; i++) {
            html += `
              <tr><td>${rownames[i]}</td><td>${data[i][0]}</td><td>${data[i][1]}</td><td>${data[i][2]}</td><td>${data[i][3]}</td></tr>
            `;
          }

          html += `
              </tbody>
            </table>
          `;

          // Set HTML element for chart
          $(`.advanced-analytics-toolsets-${$scope.extId}`).html(html);
        }
        return defer.resolve();
      });
      return defer.promise;
    },
  };
});
