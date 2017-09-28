define([
  '../util/utils',
  'ng!$q',
], (utils, $q) => {
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

      const measure1 = utils.validateMeasure(layout.props.measures[0]);
      const measure2 = utils.validateMeasure(layout.props.measures[1]);

      // Debug mode - set R dataset name to store the q data.
      utils.displayDebugModeMessage(layout.props.debugMode);
      const saveRDataset = utils.getDebugSaveDatasetScript(layout.props.debugMode, 'debug_f_test.rda');

      const defMea1 = `R.ScriptEvalExStr('NN','${saveRDataset} library(jsonlite); res<-var.test(na.omit(q$SampleA),na.omit(q$SampleB), conf.level=${layout.props.confidenceLevel});json<-toJSON(list(res$statistic,res$parameter[1],res$parameter[2],res$p.value,res$conf.int[1],res$conf.int[2],res$estimate));', ${measure1} as SampleA, ${measure2} as SampleB)`;

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

          const result = JSON.parse(dataPages[0].qMatrix[0][1].qText);

          const f = result[0];
          const numDf = result[1];
          const denomDf = result[2];
          const pValue = result[3];
          const lower = result[4];
          const upper = result[5];
          const estimate = result[6];


          // Set HTML element for chart
          $(`.advanced-analytics-toolsets-${$scope.extId}`)
          .html(`
                <h2>F test to compare two variances</h2>
                <table class="simple">
                  <thead>
                    <tr>
                      <th>Item</th><th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>F</td><td>${f}</td></tr>
                    <tr><td>num df</td><td>${numDf}</td></tr>
                    <tr><td>denom df</td><td>${denomDf}</td></tr>
                    <tr><td>p-value</td><td>${pValue}</td></tr>
                    <tr><td>${layout.props.confidenceLevel * 100}% confidence interval</td><td>${lower}, ${upper}</td></tr>
                    <tr><td>Sample estimates</td><td>ratio of variances = ${estimate}</td></tr>
                  </tbody>
              </table>
              <div>* alternative hypothesis: true ratio of variances is not equal to 1</div>
          `);
        }
        return defer.resolve();
      });
      return defer.promise;
    },
  };
});
