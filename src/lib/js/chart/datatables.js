define([
  'ng!$q',
], ($q) => {
  return {
    draw(app, $scope, elementId, dataset, html, customOptions) {
      const defer = $q.defer();
      const visualization = $scope.layout.visualization;
      let table = null;

      const options = {
        data: dataset,
        aaSorting: [],
        paging: false,
        bFilter: true,
        dom: 'Bfrtip',
        buttons: [
          {
            extend: 'copyHtml5',
            text: '<span class="lui-icon  lui-icon--large  lui-icon--copy"></span><span class="lui-button__text">Copy</span>',
            exportOptions: {
              columns: [1, 2, 3, 4, 5],
            },
          },
          {
            extend: 'csvHtml5',
            bom: true,
            charset: 'utf-8',
            text: '<span class="lui-icon  lui-icon--large  lui-icon--export"></span><span class="lui-button__text">CSV</span>',
            exportOptions: {
              columns: [1, 2, 3, 4, 5],
            },
          },
          {
            extend: 'print',
            text: '<span class="lui-icon  lui-icon--large  lui-icon--print"></span><span class="lui-button__text">Print</span>',
            exportOptions: {
              columns: [1, 2, 3, 4, 5],
            },
          },
        ],
        colReorder: true,
        select: {
          style: 'multi',
        },
        columnDefs: [
          {
            targets: [0],
            visible: false,
            searchable: false,
          },
        ],
      };

      $.extend(options, customOptions);

      require.config({
        paths: {
          'datatables.net': `/extensions/${visualization}/lib/vendor/datatables/jquery.dataTables.min`,
          'datatables.net-buttons': `/extensions/${visualization}/lib/vendor/datatables/dataTables.buttons.min`,
        },
      });
      require([
        `css!./extensions/${visualization}/lib/vendor/datatables/jquery.dataTables.min.css`,
        `css!./extensions/${visualization}/lib/vendor/datatables/buttons.dataTables.min.css`,
        `css!./extensions/${visualization}/lib/vendor/datatables/colReorder.dataTables.min.css`,
        `css!./extensions/${visualization}/lib/vendor/datatables/select.dataTables.min.css`,
        'datatables.net',
        'datatables.net-buttons',
        `./extensions/${visualization}/lib/vendor/datatables/buttons.print.min`,
        // `./extensions/${visualization}/lib/vendor/datatables/jszip.min`,
        // `./extensions/${visualization}/lib/vendor/datatables/pdfmake.min`,
        // `./extensions/${visualization}/lib/vendor/datatables/vfs_fonts`,
        `./extensions/${visualization}/lib/vendor/datatables/buttons.html5.min`,
        `./extensions/${visualization}/lib/vendor/datatables/dataTables.colReorder.min`,
        `./extensions/${visualization}/lib/vendor/datatables/dataTables.select.min`,
      ], (
        dataTablesCSS,
        buttonCSS,
        colreorderCSS,
        selectCSS,
      ) => {
        $('<style>').html(dataTablesCSS).appendTo('head');
        $('<style>').html(buttonCSS).appendTo('head');
        $('<style>').html(colreorderCSS).appendTo('head');
        $('<style>').html(selectCSS).appendTo('head');

        $(`.advanced-analytics-toolsets-${$scope.extId}`).html(html);
        table = $(elementId).DataTable(options);
        return defer.resolve(table);
      });
      return defer.promise;
    },
    setEvents(table, $scope, app) {
      table.on('select', (e, dt, type, indexes) => {
        if (type === 'row') {
          $scope.self.selectValues(0, [parseInt(table.rows(indexes).data()[0][0], 10)], true);
        }
      });
      table.on('deselect', (e, dt, type, indexes) => {
        if (type === 'row') {
          $scope.self.selectValues(0, [parseInt(table.rows(indexes).data()[0][0], 10)], true);
        }
      });
    }
  };
});
