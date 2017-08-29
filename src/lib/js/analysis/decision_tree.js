define([
  '../chart/tree_chart',
  '../../vendor/d3.min',
  '../util/utils',
  'ng!$q',
], (tree, d3, utils, $q) => {
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

      const dimension = utils.validateDimension(layout.props.dimensions[0]);

      // Set definitions for dimensions and measures
      const dimensions = [{ qDef: { qFieldDefs: [dimension] } }];

      const meaLen = layout.props.measures.length;
      let params = `${utils.validateMeasure(layout.props.measures[0])} as mea0, ${utils.validateMeasure(layout.props.measures[1])} as mea1`;
      let meaList = 'mea0 ~ mea1';
      let dataType = 'SS';

      // Array to replace param names (q$meaX) to a measure label on tree chart
      $scope.paramNames = ['mea0', 'mea1'];
      $scope.measureLabels = [layout.props.measures[0].label, layout.props.measures[1].label];

      for (let i = 2; i < meaLen; i++) {
        const mea = utils.validateMeasure(layout.props.measures[i]);
        if (mea.length > 0) {
          const param = `,${mea} as mea${i}`;
          params += param;
          meaList += ` + mea${i}`;
          dataType += 'S';

          $scope.paramNames.push(`mea${i}`);
          $scope.measureLabels.push(layout.props.measures[i].label);
        }
      }

      // Split dataset into training and test datasets
      let splitData = 'training_data<-q;';
      if (layout.props.splitDataset) {
        let training = `splitPercentage<-min(max(0.01, ${layout.props.splitPercentageForDecisionTree}), 0.99); data_end<-length(q$mea0); data_mid<-floor(data_end * splitPercentage); training_data<-list(mea0=q$mea0[1:data_mid]`;
        let test = 'test_data<-list(mea0=q$mea0[(data_mid + 1):data_end]';
        for (let i = 1; i < meaLen; i++) {
          training += `,mea${i}=q$mea${i}[1:data_mid]`;
          test += `,mea${i}=q$mea${i}[(data_mid + 1):data_end]`
        }
        training += ');';
        test += ');';
        splitData = training + test;
      }

      const measures = [
        {
          qDef: {
            qDef: `R.ScriptEvalExStr('${dataType}','library(rpart);library(partykit);library(d3r);library(jsonlite);set.seed(10);
                    q<-lapply(q, function(x){ ifelse(!is.na(as.numeric(x)), as.numeric(x), x) }); ${splitData}
                    res<-rpart(${meaList}, data=training_data, method="${layout.props.rpartMethod}", control=list(minsplit=${layout.props.minSplit}, minbucket=${layout.props.minBucket}, cp=${layout.props.cp}, maxdepth=${layout.props.maxDepth}));
                    pa<-partykit::as.party(res); if(length(pa) > 0) {node<-d3_party(res);} else {node <- c("root");}
                    json<-toJSON(list(levels(factor(training_data$mea0)),node)); json;',${params})`,
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
    drawChart($scope, app) {
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
        // Display error when all measures' grand total return NaN.
        if (dataPages[0].qMatrix[0][1].qText.length === 0 || dataPages[0].qMatrix[0][1].qText == '-') {
          utils.displayConnectionError($scope.extId);
        } else {
          const result = JSON.parse(dataPages[0].qMatrix[0][1].qText);

          if (result[1][0] == 'root') {
            // Set HTML element for chart
            $(`.advanced-analytics-toolsets-${$scope.extId}`).html(`<div id="aat-chart-${$scope.extId}" style="width:100%;height:100%;">
              <p style="width:100%;text-align:center;position:relative;top:50%;transform:translateY(-50%);">Only root node is returned. Add predictor variables to grow the decision tree.
              </div>`);
          } else {
            // var chartData = d3.hierarchy(result);
            $scope.levelsList = result[0];
            const chartData = JSON.parse(result[1]);

            // Set HTML element for chart
            $(`.advanced-analytics-toolsets-${$scope.extId}`).html(`<div id="aat-chart-${$scope.extId}" style="width:100%;height:100%;"></div>`);
            tree.draw($scope, app, chartData, `aat-chart-${$scope.extId}`, null);
          }
        }
        return defer.resolve();
      });
      return defer.promise;
    },
  };
});
