define([
  './ui_element',
  '../../vendor/leonardo-ui.min',
], (uiElement, leonardoui) => {
  return {
    registerEvents($scope, $compile) {
      // Create aggregation list
      $scope.aggregationList = ['Sum', 'Count', 'Avg', 'Min', 'Max', 'Log', ''];

      // Measure List
      let listMeasureListPopover = null;
      $scope.isMeasureListOpened = [];
      $scope.openMeasureList = ($event, measureId) => {
        if ($scope.isMeasureListOpened[measureId]) {
          // popover.close();
          $scope.isMeasureListOpened[measureId] = false;
        } else {
          $scope.isMeasureListOpened[measureId] = true;
          const element = $event.currentTarget;
          listMeasureListPopover = leonardoui.popover({
            content: uiElement.listMeasureElement.replace('<id>', `${measureId}`),
            closeOnEscape: true,
            dock: 'right',
            alignTo: element,
            onClose() {
              $scope.$apply((scope) => {
                scope.isMeasureListOpened[measureId] = false;
                scope.meaSearchString = '';
              });
            },
          });
          $compile($('div.lui-popover'))($scope);
        }
      };

      // Drill down to measure aggr list
      $scope.drilldownMeasure = (measureId, expressionName, expressionValue) => {
        $scope.measureId = measureId;
        // $scope.expressoin = expressionName;
        const a = uiElement.listAggrMeasureElement.replace('<measureId>', `${measureId}`);
        const b = a.replace('<measureId>', `${measureId}`);
        const c = b.replace('<expressionName>', `${expressionName}`)
        const d = c.replace('<expressionValue>', `${expressionValue}`);

        $('div.lui-popover').html(d);
        $compile($('div.lui-popover'))($scope);
      };

      // Go back to top measure list
      $scope.goBackMeasure = ($event, measureId) => {
        $('div.lui-popover').replaceWith(uiElement.listMeasureElement.replace('<id>', `${measureId}`));
        $compile($('div.lui-popover'))($scope);
      };

      // Select measure
      $scope.selectMeasure = (measureId, aggregation, expression) => {
        for (let i = measureId; i >= 0; i--) {
          if (typeof $scope.layout.props.measures[i] == 'undefined') {
            measureId = i;
          }
        }
        let expressionWithAggregation = null;
        // When expression includes whitespace, add square brankets
        if (/\s/.test(expression)) {
          expressionWithAggregation = `${aggregation}([${expression}])`;
        } else {
          expressionWithAggregation = `${aggregation}(${expression})`;
        }
        $scope.backendApi.applyPatches([
          {
            qPath: `/props/measures/${measureId}`,
            qOp: 'add',
            qValue: JSON.stringify({
              label: expressionWithAggregation,
              expression: expressionWithAggregation,
            }),
          },
        ], false);

        listMeasureListPopover.close();
      };

      // Remove measure selection
      $scope.removeMeasure = (measureId) => {
        $scope.backendApi.applyPatches([
          {
            qPath: `/props/measures/${measureId}`,
            qOp: 'remove',
          },
        ], false);
      };

      // Add measure button
      $scope.addButton = (analysisTypeId) => {
        $scope.customMinMeas[analysisTypeId] += 1;
      };

      // Remove measaure button
      $scope.removeButton = (analysisTypeId) => {
        // Remove button only when the number of button is over minMeas value
        if ($scope.customMinMeas[analysisTypeId] > $scope.minMeas) {
          // If removing measure item is already set, remove it from the property.
          if (typeof $scope.layout.props.measures[$scope.customMinMeas[analysisTypeId] - 1] != 'undefined') {
            $scope.removeMeasure($scope.customMinMeas[analysisTypeId] - 1);
          }
          $scope.customMinMeas[analysisTypeId] -= 1;
        }
      };
    },
  };
});
