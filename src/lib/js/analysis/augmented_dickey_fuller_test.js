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
      const dimensions = [{ qDef: { qFieldDefs: [dimension] } }];
      const measure = utils.validateMeasure(layout.props.measures[0]);


      // Set first and seasonal differences to acf and pacf
      const dataType = 'N';
      let expression = null;
      $scope.dataTitle = null;

      if (layout.props.differencing === 1) {
        expression = `R.ScriptEvalExStr('${dataType}','library(jsonlite); library(tseries); res<-adf.test(diff(q$Measure, ${layout.props.seasonalDifferences})); json<-toJSON(list(res$statistic,res$parameter,res$p.value)); json;', ${measure} as Measure)`;
        $scope.dataTitle = `diff(${measure},${layout.props.seasonalDifferences})`;
      } else if (layout.props.differencing === 2) {
        expression = `R.ScriptEvalExStr('${dataType}','library(jsonlite); library(tseries); res<-adf.test(diff(diff(q$Measure, ${layout.props.seasonalDifferences}), ${layout.props.firstDifferences})); json<-toJSON(list(res$statistic,res$parameter,res$p.value)); json;', ${measure} as Measure)`;
        $scope.dataTitle = `diff(diff(${measure}, ${layout.props.seasonalDifferences}),${layout.props.firstDifferences})`;
      } else {
        expression = `R.ScriptEvalExStr('${dataType}','library(jsonlite); library(tseries); res<-adf.test(q$Measure); json<-toJSON(list(res$statistic,res$parameter,res$p.value)); json;', ${measure} as Measure)`;
        $scope.dataTitle = measure;
      }

      const measures = [
        {
          qDef: {
            qLabel: 'Results',
            qDef: expression,
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
          const result = JSON.parse(dataPages[0].qMatrix[0][1].qText);

          // Set HTML element for chart
          $(`.advanced-analytics-toolsets-${$scope.extId}`)
          .html(`
            <h2>Augmented Dickey-Fuller Test</h2>
            <table class="simple">
              <thead>
                <tr>
                  <th>Item</th><th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>data</td><td>${$scope.dataTitle}</td></tr>
                <tr><td>Dickey-Fuller</td><td>${result[0]}</td></tr>
                <tr><td>Lag order</td><td>${result[1]}</td></tr>
                <tr><td>p-value</td><td>${result[2]}</td></tr>
              </tbody>
            </table>
            <div>* alternative hypothesis: stationary</div>
          `);
        }
        return defer.resolve();
      });
      return defer.promise;
    },
  };
});
