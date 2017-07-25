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

      const numberOfClusters = layout.props.numberOfClusters;

      // Set definitions for dimensions and measures
      const dimension = utils.validateDimension(layout.props.dimensions[0]);
      const dimensions = [
        {
          qDef: {
            qFieldDefs: [dimension],
            // qSortCriterias: layout.qHyperCubeDef.qDimensions[0].qDef.qSortCriterias
          },
        },
      ];
      const meaLen = layout.props.measures.length;
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
        }
      }

      let data = `cbind(${meaList})`;
      if (layout.props.scaleData) {
        data = `scale(cbind(${meaList}))`;
      }

      let measure = '';
      if (typeof layout.props.optimizationMethod == 'undefined' || layout.props.optimizationMethod == 'gap') {
        measure = `R.ScriptEvalExStr('${dataType}','library(cluster); library(jsonlite); set.seed(1); gap_kmeans<-clusGap(${data}, FUNcluster=kmeans, K.max=${layout.props.clusterMax}, B=${layout.props.bootstrap}); json<-toJSON(gap_kmeans$Tab); json;', ${params})`
      }
      const measures = [
        {
          qDef: {
            qDef: measure,
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
        const measureInfo = $scope.layout.qHyperCube.qMeasureInfo;

        // Display error when all measures' grand total return NaN.
        if (dataPages[0].qMatrix[0][1].qText.length === 0 || dataPages[0].qMatrix[0][1].qText == '-') {
          utils.displayConnectionError($scope.extId);
        } else {
          const result = JSON.parse(dataPages[0].qMatrix[0][1].qText);
          const palette = utils.getOneHundredColors();

          const x = [];
          const gap = [];
          const seSim = [];

          $.each(result, (key, value) => {
            x.push(key + 1);
            gap.push(value[2]);
            seSim.push(value[3]);
          })

          const chartData = [
            {
              x: x,
              y: gap,
              name: 'Gap statistic',
              error_y: {
                type: 'data',
                symmetric: false,
                array: seSim,
                arrayminus: seSim,
                thickness: layout.props.borderWidth,
                color: (layout.props.colors) ? `rgba(${palette[3]},1)` : `rgba(${palette[layout.props.colorForMain]},1)`,
              },
              type: 'scatter',
              mode: 'markers+lines',
              marker: {
                color: (layout.props.colors) ? `rgba(${palette[3]},1)` : `rgba(${palette[layout.props.colorForMain]},1)`,
                size: layout.props.pointRadius,
              },
            },
          ];

          // Set HTML element for chart
          $(`.advanced-analytics-toolsets-${$scope.extId}`).html(`<div id="aat-chart-${$scope.extId}" style="width:100%;height:100%;"></div>`);

          lineChart.draw($scope, chartData, `aat-chart-${$scope.extId}`, null);
        }
        return defer.resolve();
      });
      return defer.promise;
    },
  };
});
