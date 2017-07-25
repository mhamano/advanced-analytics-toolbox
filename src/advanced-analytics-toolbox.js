define([
  'qlik',
  'jquery',
  'css!./lib/css/styles.css',
  './properties',
  './initialProperties',
  'text!./advanced-analytics-toolbox.ng.html',
  './lib/js/ui/ui_control',
  './lib/js/analysis/analysis',
  './lib/js/util/utils',
], (qlik, $, cssContent, props, initialProps, ngTemplate, ui, analysis, utils) => {
  // Set style sheet
  $('<style>').html(cssContent).appendTo('head');


  /**
   * createChart - call createCube function based on the selected analysis type
   *
   * @param {Object} $scope   angular $scope
   * @param {Object} $compile angular $compile
   * @param {Object} app      reference to app
   *
   * @return {Null} null
   */
  const createChart = ($scope, $compile, app) => {
    const visualization = $scope.layout.visualization;

    const selectedAnalysisType = analysis.analysisTypes.filter((d) => {
      return d.id === $scope.layout.props.analysisTypeId;
    });
    require([`./extensions/${visualization}/lib/js/analysis/${selectedAnalysisType[0].file}`], (hyperCubeCreator) => {
      hyperCubeCreator.createCube(app, $scope);
    });
    return null;
  };

  /**
   * isMinDimAndMeaUnmet - check the number of dimensions and measures
   *                       required for the selected chart type.
   *
   * @param {Object} $scope angular $scope
   *
   * @return {Boolean} Return true if minimum number of dimensions and measures
   *                required for the selected chart type is not met.
   */
  const isMinDimAndMeaUnmet = ($scope) => {
    // Set number of current dim and mea count
    const dimCount = $scope.layout.props.dimensions.length;
    const meaCount = $scope.layout.props.measures.length;

    // Filter the selected analysis type
    const selectedAnalysisType = analysis.analysisTypes.filter((d) => {
      return d.id === $scope.layout.props.analysisTypeId;
    });

    // When customMinMeas is set, set it as an effective Minumum Measures count value.
    const effectiveMinMeas = (typeof $scope.customMinMeas == 'undefined' || typeof $scope.customMinMeas[$scope.layout.props.analysisTypeId] == 'undefined') ? selectedAnalysisType[0].minMeas : $scope.customMinMeas[$scope.layout.props.analysisTypeId];

    if (
      selectedAnalysisType[0].minDims > dimCount ||
      effectiveMinMeas > meaCount
    ) {
      return true;
    }

    for (let i = 0; i < dimCount; i++) {
      if (typeof $scope.layout.props.dimensions[i].expression.qStringExpression == 'undefined' && $scope.layout.props.dimensions[i].expression === '') { return true; }
    }

    for (let i = 0; i < meaCount; i++) {
      if (typeof $scope.layout.props.measures[i].expression.qStringExpression == 'undefined' && $scope.layout.props.measures[i].expression === '') { return true; }
    }
    return false;
  };

  /**
   * checkPreconditions - Check precondition for rendering charts.
   *
   * @param {Object} $scope    angular $scope
   * @param {Object} $compile  angular $compile
   * @param {Object} app       reference to app
   * @param {Object} callback1 called when analysis category and type is not selected.
   * @param {Object} callback2 called when requirement for minumum dimension and measure is not met.
   * @param {Object} callback3 called when all requirements for chart rendering is met
   *
   * @return {Null} null
   */
  const checkPreconditions = ($scope, $compile, app, callback1, callback2, callback3) => {
    const layoutProps = $scope.layout.props;
    if (layoutProps.analysisCategoryId === -1 || layoutProps.analysisTypeId === -1) {
      callback1($scope, $compile, app);
    } else if (isMinDimAndMeaUnmet($scope)) {
      callback2($scope, $compile, app);
    } else {
      callback3($scope, $compile, app);
    }
    return null;
  };

  return {
    initialProperties: initialProps,
    definition: props,
    support: {
      snapshot: true,
      export: false,
      exportData: true,
    },
    template: ngTemplate,
    // Controller
    controller: ['$scope', '$compile', ($scope, $compile) => {
      // Get a reference to app
      const app = qlik.currApp(this);

      // Set extension id
      $scope.extId = $scope.layout.qInfo.qId;

      // Set patch applied flat.
      $scope.patchApplied = false;

      // Create variable to store chart
      $scope.chart = [];

      // Get number format (thousand separators, decimal separators, etc) from locale info
      utils.setLocaleInfo($scope, app);

      // Store $compile under $scope to be accessible from paint method
      $scope.compile = $compile;

      // Watch the change of the settings on property panel
      $scope.$watch('layout.props', (layoutProps) => {
        checkPreconditions(
          $scope, $compile, app,
          (a, b, c) => {
            $scope.screen = 0;
            // create HTML is called in paint
            // ui.createHtmlElements(a, b, c);
          },
          (a, b, c) => {
            $scope.screen = 1;
            // create HTML is called in paint
            // ui.createHtmlElements(a, b, c);
          },
          (a, b, c) => {
            createChart(a, b, c);
          },
        );
      }, true);
    }],
    // Paint
    paint($element, layout) {
      // Get a reference to app
      const app = qlik.currApp(this);

      // Set a flag to display 'Incomplete visualization' in 'analysis' mode.
      // In 'edit' mode, a chart or buttons for settings are displayed.
      const mode = qlik.navigation.getMode();
      if (mode === 'analysis') {
        this.$scope.incomplete = true;
      } else {
        this.$scope.incomplete = false;
      }

      // Create HTML element when analysis category and type is not selected,
      // or when min dim and mea requirements are not met.
      checkPreconditions(
        this.$scope, this.$scope.compile, app,
        (_$scope, _$compile, _app) =>  {
          this.$scope.screen = 0;
          ui.createHtmlElements(_$scope, _$compile, _app);
        },
        (_$scope, _$compile, _app) =>  {
          this.$scope.screen = 1;
          ui.createHtmlElements(_$scope, _$compile, _app);
        },
        () => {}, // Ignore when a chart is displayed
      );

      // drawChart is called only when patchApplied flag is true to avoid called
      // twice: initial paint call and paint method called when patch applied.
      // Leave the flag true after initial call because paint method is called
      // when record selections and drawChart need to be called.
      if (this.$scope.patchApplied) {
        // Retrieve updated data and redraw the chart with the data
        checkPreconditions(
          this.$scope, this.$compile, app,
          () => {}, // Ignore when analysis category and type is not selected.
          () => {}, // Ignore when min dim and mea requirements are not met.
          (_$scope, _$compile, _app) => {
            const visualization = _$scope.layout.visualization;

            // Filter the selected analysis type
            const selectedAnalysisType = analysis.analysisTypes.filter((d) => {
              return d.id === _$scope.layout.props.analysisTypeId;
            });
            require([`./extensions/${visualization}/lib/js/analysis/${selectedAnalysisType[0].file}`], (hyperCubeCreator) => {
              hyperCubeCreator.drawChart(_$scope, _app).then(() => {
                return qlik.Promise.resolve();
              });
            });
          },
        );
      } // end of if
    },
  };
});
