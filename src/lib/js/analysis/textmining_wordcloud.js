define([
  '../chart/wordcloud',
  '../util/utils',
  'ng!$q',
], (wordCloud, utils, $q) => {
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

      const dimension0 = utils.validateDimension(layout.props.dimensions[0]);

      const dimensions = [
        {
          qDef: {
            qFieldDefs: [dimension0],
          },
        },
      ];
      const dimension1 = utils.validateDimension(layout.props.dimensions[1]);

      // Debug mode - set R dataset name to store the q data.
      utils.displayDebugModeMessage(layout.props.debugMode);
      const saveRDataset = utils.getDebugSaveDatasetScript(layout.props.debugMode, 'debug_textmining_wordcloud.rda');

      const defMea1 = `R.ScriptEvalExStr('S','
               ${saveRDataset}
               library(tm);
               library(jsonlite);
               library(SnowballC);
               counter <- 1:length(q$text);
               res <- c();
               for(i in counter) res <- paste(res, q$text[i]);
               corpus<-VCorpus(VectorSource(res));
               tdm <- TermDocumentMatrix(corpus, control = list(
                 tolower = ${layout.props.tolower},
                 removeNumbers = ${layout.props.removeNumbers},
                 stopwords = ${layout.props.stopwords},
                 removePunctuation = ${layout.props.removePunctuation},
                 stemming = ${layout.props.stemming}
               ));
               m <-as.matrix(tdm)
               sorted<-m[order(m[,1], decreasing=T),];
               x<-list(names(sorted)[1:${layout.props.numOfFrequentTerms}], sorted[1:${layout.props.numOfFrequentTerms}]);
               json<-toJSON(x, pretty=T);
               json;
             ', ${dimension1} AS text)`;

      // Debug mode - display R Scripts to console
      utils.displayRScriptsToConsole(layout.props.debugMode, [defMea1]);

      const measures = [
        {
          qDef: {
            qLabel: 'Result',
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
    drawChart($scope, app) {
      const defer = $q.defer();
      const layout = $scope.layout;

      // const dimension = utils.validateDimension(layout.props.dimensions[0]);
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
          // Debug mode - display returned dataset to console
          utils.displayReturnedDatasetToConsole(layout.props.debugMode, dataPages[0]);

          const palette = utils.getDefaultPaletteColor();

          const text = JSON.parse(dataPages[0].qMatrix[0][1].qText)[0];
          const weight = JSON.parse(dataPages[0].qMatrix[0][1].qText)[1];

          const dataset = [];
          for (let i = 0; i < text.length; i++) {
            dataset.push(
              {
                text: text[i],
                weight: weight[i],
                handlers: {
                  click: function() {
                    app.selectAssociations(0, [text[i]], { qSearchFields:  [utils.validateDimension(layout.props.dimensions[1])] })
                  },
                },
              },
            );
          }

          // Set HTML element for chart
          $(`.advanced-analytics-toolsets-${$scope.extId}`).html(`<div style="width:100%; height:100%" id="aat-chart"></div>`);

          wordCloud.draw(dataset);
        }
        return defer.resolve();
      });
      return defer.promise;
    },
  };
});
