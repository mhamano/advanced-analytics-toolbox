define(['./lib/js/analysis/analysis', 'qlik', 'ng!$q'], (analysis, qlik, $q) => {
  // Control on debug mode
  const enableDebugMode = true;

  const getNumberFormatSimple = () => {
    const app = qlik.currApp(this);
    const defer = $q.defer();

    app.getAppLayout((layout) => {
      const thousandSep = layout.qLocaleInfo.qThousandSep;
      const decimalSep = layout.qLocaleInfo.qDecimalSep;
      return defer.resolve(
        [
          {
            value: 0,
            label: `1${thousandSep}000`,
          },
          {
            value: 1,
            label: `1${thousandSep}000${decimalSep}1`,
          },
          {
            value: 2,
            label: `1${thousandSep}000${decimalSep}12`,
          },
          {
            value: 3,
            label: '12%',
          },
          {
            value: 4,
            label: `12${decimalSep}3%`,
          },
          {
            value: 5,
            label: `12${decimalSep}34%`,
          },
        ]);
    });
    return defer.promise;
  };

  return {
    type: 'items',
    component: 'accordion',
    items: {
      // dimensions: {
      //   uses: "dimensions",
      //   show: false,
      // },
      // measures: {
      //   uses: "measures",
      //   show: false,
      // },
      dims: {
        label: 'Dimensions',
        items: {
          Dimensions: {
            type: 'array',
            ref: 'props.dimensions',
            label: 'Dimensions',
            itemTitleRef: 'label',
            allowAdd: true,
            allowRemove: true,
            addTranslation: 'Add dimension',
            items: {
              expression: {
                label: 'Field',
                type: 'string',
                ref: 'expression',
                expression: 'optional',
              },
              label: {
                label: 'Label',
                type: 'string',
                maxlength: 100,
                ref: 'label',
              },
            },
          },
        },
      },
      meas: {
        label: 'Measures',
        items: {
          Measures: {
            type: 'array',
            ref: 'props.measures',
            label: 'Measures',
            itemTitleRef: 'label',
            allowAdd: true,
            allowRemove: true,
            addTranslation: 'Add measure',
            items: {
              expression: {
                label: 'Expression',
                type: 'string',
                ref: 'expression',
                expression: 'optional',
              },
              label: {
                label: 'Label',
                type: 'string',
                maxlength: 100,
                ref: 'label',
              },
              numberFormatting: {
                type: 'string',
                component: 'dropdown',
                label: 'Number formatting',
                ref: 'numberFormatting',
                options: [
                  {
                    value: 0,
                    label: 'Auto',
                  },
                  {
                    value: 1,
                    label: 'Number',
                  },
                  {
                    value: 2,
                    label: 'Money',
                  },
                  {
                    value: 5,
                    label: 'Custom',
                  },
                ],
                defaultValue: 0,
              },
              formatting: {
                type: 'boolean',
                component: 'switch',
                label: 'Formatting',
                ref: 'formatting',
                options: [{
                  value: true,
                  label: 'Simple',
                }, {
                  value: false,
                  label: 'Custom',
                }],
                defaultValue: true,
                show: (data) => {
                  return data.numberFormatting === 1;
                },
              },
              numberFormattingSimple: {
                type: 'string',
                component: 'dropdown',
                ref: 'numberFormattingSimple',
                options: getNumberFormatSimple().then((items) => {
                  return items;
                }),
                defaultValue: 2,
                show: (data) => {
                  return data.numberFormatting === 1 && (data.formatting === true || typeof data.formatting == 'undefined');
                },
              },
              customCurrency: {
                label: 'Currency',
                type: 'string',
                maxlength: 100,
                ref: 'customCurrency',
                defaultValue: '$',
                show: (data) => {
                  return data.numberFormatting === 2;
                },
              },
              prefixSuffix: {
                type: 'string',
                component: 'dropdown',
                ref: 'prefixSuffix',
                options: [{
                  value: 'prefix',
                  label: 'Prefix',
                }, {
                  value: 'suffix',
                  label: 'Suffix',
                }],
                defaultValue: 'prefix',
                show: (data) => {
                  return data.numberFormatting === 2;
                },
              },
              numberFormatPattern: {
                label: 'Format pattern',
                type: 'string',
                maxlength: 100,
                ref: 'numberFormatPattern',
                defaultValue: ',.2f',
                show: (data) => {
                  return data.numberFormatting === 1 && data.formatting === false;
                },
              },
              moneyFormatPattern: {
                label: 'Format pattern',
                type: 'string',
                maxlength: 100,
                ref: 'moneyFormatPattern',
                defaultValue: ',.2f',
                show: (data) => {
                  return data.numberFormatting === 2;
                },
              },
              customFormatPattern: {
                label: 'Format pattern',
                type: 'string',
                maxlength: 100,
                ref: 'customFormatPattern',
                defaultValue: ',.2f',
                show: (data) => {
                  return data.numberFormatting === 5;
                },
              },
            },
          },
        },
      },
      sorting: {
        type: 'items',
        label: 'Sorting',
        items: {
          sortMessage: {
            label: 'Sort function is not provided for this analysis type. Sort the data source or perform sort in the load script.',
            component: 'text',
            show: (data) => {
              return [0, 17].indexOf(data.props.analysisTypeId) < 0;
            },
          },
          sortDim: {
            type: 'items',
            label: 'Dimension',
            show: (data) => {
              return [0, 17].indexOf(data.props.analysisTypeId) >= 0;
            },
            items: {
              dimSort: {
                type: 'boolean',
                component: 'switch',
                label: 'Sorting',
                ref: 'props.dimSort',
                options: [{
                  value: true,
                  label: 'Auto',
                }, {
                  value: false,
                  label: 'Custom',
                }],
                defaultValue: true,
              },
              dimSortByExpression: {
                type: 'boolean',
                label: 'Sort by expression',
                ref: 'props.dimSortByExpression',
                defaultValue: false,
                show: (data) => {
                  return !data.props.dimSort;
                },
              },
              dimSortByExpressionAsc: {
                type: 'integer',
                component: 'dropdown',
                ref: 'props.dimSortByExpressionAsc',
                options: [{
                  value: 1,
                  label: 'Ascending',
                }, {
                  value: -1,
                  label: 'Descending',
                }],
                defaultValue: 1,
                show: (data) => {
                  return !data.props.dimSort && data.props.dimSortByExpression;
                },
              },
              dimSortByExpressionString: {
                label: 'Expression',
                type: 'string',
                ref: 'props.dimSortByExpressionString',
                expression: 'optional',
                show: (data) => {
                  return !data.props.dimSort && data.props.dimSortByExpression;
                },
              },
              dimSortByNum: {
                type: 'boolean',
                label: 'Sort numerically',
                ref: 'props.dimSortByNum',
                defaultValue: false,
                show: (data) => {
                  return !data.props.dimSort;
                },
              },
              dimSortByNumAsc: {
                type: 'integer',
                component: 'dropdown',
                ref: 'props.dimSortByNumAsc',
                options: [{
                  value: 1,
                  label: 'Ascending',
                }, {
                  value: -1,
                  label: 'Descending',
                }],
                defaultValue: 1,
                show: (data) => {
                  return !data.props.dimSort && data.props.dimSortByNum;
                },
              },
              dimSortByAlph: {
                type: 'boolean',
                label: 'Sort alphabetically',
                ref: 'props.dimSortByAlph',
                defaultValue: false,
                show: (data) => {
                  return !data.props.dimSort;
                },
              },
              dimSortByAlphAsc: {
                type: 'integer',
                component: 'dropdown',
                ref: 'props.dimSortByAlphAsc',
                options: [{
                  value: 1,
                  label: 'Ascending',
                }, {
                  value: -1,
                  label: 'Descending',
                }],
                defaultValue: 1,
                show: (data) => {
                  return !data.props.dimSort && data.props.dimSortByAlph;
                },
              },
            },
          },
        },
      },
      addons: {
        uses: 'addons',
        items: {
          dataHandling: {
            uses: 'dataHandling',
          },
          // Section for Reference Line
            ReferenceLine: {
                label: 'Reference Line',
                items: {
                    fixlimit: {
                        ref: 'props.limit',
                        label: 'Limit',
                        type: 'integer',
                        defaultValue: "",
                        show: (data) => {
                            return [9].indexOf(data.props.analysisTypeId) >= 0;
                        },
                    },
                    fixlimitlabel:{
                      type:'string',
                      label:'Label',
                      ref:'props.limitlabel',
                      defaultValue:'Reference Line',
                      show:(data)=>{
                        return[9].indexOf(data.props.analysisTypeId)>=0;
                      },
                    },
                    //line style
                    fixlimitstyle: {
                        type: 'string',
                        label: 'Line style',
                        component: 'dropdown',
                        ref: 'props.limitstyle',
                        options: [{
                            value: 'lines',
                            label: 'lines',
                        }, {
                            value: 'dashdot',
                            label: 'dashdot',
                        }, {
                            value: 'solid',
                            label: 'solid',
                        }, {
                            value: 'dot',
                            label: 'dot',
                        }],
                        defaultValue: 'lines',
                        show: (data) => {
                            return [9].indexOf(data.props.analysisTypeId) >= 0;
                        },
                    },
                    //line width
                    fixlimitwidth: {
                        type: 'string',
                        label: 'Line Width',
                        component: 'dropdown',
                        ref: 'props.limitwidth',
                        options: [{
                            value: '1',
                            label: 'tiny',
                        }, {
                            value: '2',
                            label: 'mid',
                        }, {
                            value: '4',
                            label: 'huge',
                        }],
                        defaultValue: '1',
                        show: (data) => {
                            return [9].indexOf(data.props.analysisTypeId) >= 0;
                        },
                    },
                    // line color
                    fixlimitcolor: {
                        label: 'Color',
                        component: 'color-picker',
                        ref: 'props.limitcolor',
                        type: 'object',
                        defaultValue: {
                          index: 11,
                          color: "#000000"  
                        },
                        show: (data) => {
                            return [9].indexOf(data.props.analysisTypeId) >= 0;
                        },
                    },
                },
            },
          //end of section for Reference line
        },
      },
      analysis: {
        label: 'Analysis Settings',
        items: {
          analysisCategoryDropDown: {
            type: 'integer',
            component: 'dropdown',
            label: 'Analysis Category',
            ref: 'props.analysisCategoryId',
            options: analysis.analysisCategories.map((d) => {
              return {
                value: d.id,
                label: d.name,
              };
            }),
            defaultValue: -1,
          },
          analysisTypeDropDown: {
            type: 'integer',
            component: 'dropdown',
            label: 'Analysis Type',
            ref: 'props.analysisTypeId',
            options: (data) => {
              const res = analysis.analysisTypes
              .filter((d) => {
                return d.category === data.props.analysisCategoryId;
              })
              .map((d) => {
                return {
                  value: d.id,
                  label: d.name,
                };
              });
              return res;
            },
            show: (data) => {
              return data.props.analysisCategoryId >= 0;
            },
            defaultValue: -1,
          },
          displayTable: {
            type: 'boolean',
            component: 'switch',
            label: 'Table display mode',
            ref: 'props.displayTable',
            options: [{
              value: false,
              label: 'Off',
            }, {
              value: true,
              label: 'On',
            }],
            defaultValue: false,
            show: (data) => {
              return [0, 9, 30].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          // *****
          // Analysis Options
          // *****
          displayFormula: {
            type: 'boolean',
            component: 'switch',
            label: 'Display formula',
            ref: 'props.displayFormula',
            options: [{
              value: false,
              label: 'Off',
            }, {
              value: true,
              label: 'On',
            }],
            defaultValue: false,
            show: (data) => {
              return [0].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          extendLine: {
            type: 'boolean',
            component: 'switch',
            label: 'Extend line',
            ref: 'props.extendLine',
            options: [{
              value: false,
              label: 'Off',
            }, {
              value: true,
              label: 'On',
            }],
            defaultValue: false,
            show: (data) => {
              return [0].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          extendDurations: {
            ref: 'props.extendDurations',
            label: 'Extend durations',
            type: 'string',
            show: (data) => {
              return [0].indexOf(data.props.analysisTypeId) >= 0 && data.props.extendLine === true;
            },
            defaultValue: 12,
          },
          interval: {
            type: 'string',
            component: 'dropdown',
            label: 'Interval',
            ref: 'props.interval',
            options: [{
              value: 'confidence',
              label: 'confidence',
            }, {
              value: 'prediction',
              label: 'prediction',
            }],
            defaultValue: 'confidence',
            show: (data) => {
              return [0, 1, 17].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          confidenceLevel: {
            ref: 'props.confidenceLevel',
            label: 'Confidence level',
            type: 'string',
            show: (data) => {
              return [0, 1, 2, 3, 4, 5, 9, 17, 22, 30].indexOf(data.props.analysisTypeId) >= 0;
            },
            defaultValue: 0.95,
          },
          frequency: {
            ref: 'props.frequency',
            label: 'Frequency',
            type: 'integer',
            show: (data) => {
              return [8, 9, 30].indexOf(data.props.analysisTypeId) >= 0;
            },
            defaultValue: 12,
          },
          // k-means
          numberOfClusters: {
            ref: 'props.numberOfClusters',
            label: 'Number of clusters',
            type: 'integer',
            show: (data) => {
              return [10, 16, 24].indexOf(data.props.analysisTypeId) >= 0;
            },
            defaultValue: 3,
          },
          optimizationMethod: {
            ref: 'props.optimizationMethod',
            label: 'Optimization method',
            component: 'dropdown',
            type: 'string',
            options: [{
              value: 'gap',
              label: 'Gap Statistic',
            }],
            defaultValue: 'gap',
            show: (data) => {
              return [23].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          clusterMax: {
            ref: 'props.clusterMax',
            label: 'Max number of clusters',
            type: 'integer',
            show: (data) => {
              return [23].indexOf(data.props.analysisTypeId) >= 0;
            },
            defaultValue: 10,
          },
          bootstrap: {
            ref: 'props.bootstrap',
            label: 'Number of Monte Carlo samples',
            type: 'integer',
            show: (data) => {
              return [23].indexOf(data.props.analysisTypeId) >= 0;
            },
            defaultValue: 10,
          },
          scaleData: {
            type: 'boolean',
            component: 'switch',
            label: 'Scale data',
            ref: 'props.scaleData',
            options: [{
              value: false,
              label: 'Off',
            }, {
              value: true,
              label: 'On',
            }],
            defaultValue: false,
            show: (data) => {
              return [10, 16, 23, 24].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          dividedBy: {
            type: 'string',
            component: 'dropdown',
            label: 'Grouped by',
            ref: 'props.dividedBy',
            options: [{
              value: 'variables',
              label: 'Variables',
            },
            {
              value: 'clusters',
              label: 'Clusters',
            }],
            defaultValue: 'clusters',
            show: (data) => {
              return [24].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          // Time series analysis
          differencing: {
            ref: 'props.differencing',
            label: 'Differencing',
            component: 'dropdown',
            type: 'integer',
            options: [{
              value: 0,
              label: 'Off',
            }, {
              value: 1,
              label: 'Seasonal differences',
            }, {
              value: 2,
              label: 'First and seasonal differences',
            }],
            defaultValue: 0,
            show: (data) => {
              return [6, 7, 12].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          seasonalDifferences: {
            ref: 'props.seasonalDifferences',
            label: 'Seasonal differences',
            type: 'integer',
            defaultValue: 12,
            show: (data) => {
              return [6, 7, 12].indexOf(data.props.analysisTypeId) >= 0 && [1, 2].indexOf(data.props.differencing) >= 0;
            },
          },
          firstDifferences: {
            ref: 'props.firstDifferences',
            label: 'First differences',
            type: 'integer',
            defaultValue: 1,
            show: (data) => {
              return [6, 7, 9, 12].indexOf(data.props.analysisTypeId) >= 0 && data.props.differencing === 2;
            },
          },
          // Autocorrelation
          lagMax: {
            type: 'boolean',
            component: 'switch',
            label: 'Lag max',
            ref: 'props.lagMax',
            options: [{
              value: true,
              label: 'Auto',
            }, {
              value: false,
              label: 'Custom',
            }],
            defaultValue: true,
            show: (data) => {
              return [6].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          lagMaxValue: {
            ref: 'props.lagMaxValue',
            label: 'Lag max',
            type: 'integer',
            defaultValue: 20,
            show: (data) => {
              return [6].indexOf(data.props.analysisTypeId) >= 0 && data.props.lagMax === false;
            },
          },
          // Ljung-Box Test
          lag: {
            type: 'boolean',
            component: 'switch',
            label: 'Lag',
            ref: 'props.lag',
            options: [{
              value: true,
              label: 'Auto',
            }, {
              value: false,
              label: 'Custom',
            }],
            defaultValue: true,
            show: (data) => {
              return [7].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          lagValue: {
            ref: 'props.lagValue',
            label: 'Lag',
            type: 'integer',
            defaultValue: 1,
            show: (data) => {
              return [7].indexOf(data.props.analysisTypeId) >= 0 && data.props.lag === false;
            },
          },
          // Decompose time series
          decomposeInFourCharts: {
            type: 'boolean',
            component: 'switch',
            label: 'Display in 4 charts ',
            ref: 'props.decomposeInFourCharts',
            options: [{
              value: true,
              label: 'On',
            }, {
              value: false,
              label: 'Off',
            }],
            defaultValue: true,
            show: (data) => {
              return [8].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          // ARIMA forecast
          forecastingPeriods: {
            ref: 'props.forecastingPeriods',
            label: 'Forecasting periods',
            type: 'integer',
            show: (data) => {
              return [9, 30].indexOf(data.props.analysisTypeId) >= 0;
            },
            defaultValue: 12,
          },
          displayARIMAParams: {
            type: 'boolean',
            component: 'switch',
            label: 'Display ARIMA parameters',
            ref: 'props.displayARIMAParams',
            options: [{
              value: false,
              label: 'Off',
            }, {
              value: true,
              label: 'On',
            }],
            defaultValue: false,
            show: (data) => {
              return [9].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          autoARIMA: {
            type: 'boolean',
            component: 'switch',
            label: 'Parameter settings',
            ref: 'props.autoARIMA',
            options: [{
              value: true,
              label: 'Auto',
            }, {
              value: false,
              label: 'Custom',
            }],
            defaultValue: true,
            show: (data) => {
              return [9].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          AROrder: {
            ref: 'props.AROrder',
            label: 'AR Order(p)',
            type: 'integer',
            defaultValue: 0,
            show: (data) => {
              return [9].indexOf(data.props.analysisTypeId) >= 0 && data.props.autoARIMA === false;
            },
          },
          DegreeOfDifferencing: {
            ref: 'props.DegreeOfDifferencing',
            label: 'Degree of differencing(d)',
            type: 'integer',
            defaultValue: 0,
            show: (data) => {
              return [9].indexOf(data.props.analysisTypeId) >= 0 && data.props.autoARIMA === false;
            },
          },
          MAOrder: {
            ref: 'props.MAOrder',
            label: 'MA Order(q)',
            type: 'integer',
            defaultValue: 0,
            show: (data) => {
              return [9].indexOf(data.props.analysisTypeId) >= 0 && data.props.autoARIMA === false;
            },
          },
          SeasonalAROrder: {
            ref: 'props.SeasonalAROrder',
            label: 'Seasonal AR Order(P)',
            type: 'integer',
            defaultValue: 0,
            show: (data) => {
              return [9].indexOf(data.props.analysisTypeId) >= 0 && data.props.autoARIMA === false;
            },
          },
          SeasonalDegreeOfDifferencing: {
            ref: 'props.SeasonalDegreeOfDifferencing',
            label: 'Seasonal degree of differencing(D)',
            type: 'integer',
            defaultValue: 0,
            show: (data) => {
              return [9].indexOf(data.props.analysisTypeId) >= 0 && data.props.autoARIMA === false;
            },
          },
          SeasonalMAOrder: {
            ref: 'props.SeasonalMAOrder',
            label: 'Seasonal MA Order(Q)',
            type: 'integer',
            defaultValue: 0,
            show: (data) => {
              return [9].indexOf(data.props.analysisTypeId) >= 0 && data.props.autoARIMA === false;
            },
          },
          // HoltWinters
          displayHoltWintersParams: {
            type: 'boolean',
            component: 'switch',
            label: 'Display Holt-Winters parameters',
            ref: 'props.displayHoltWintersParams',
            options: [{
              value: false,
              label: 'Off',
            }, {
              value: true,
              label: 'On',
            }],
            defaultValue: false,
            show: (data) => {
              return [30].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          autoHoltWinters: {
            type: 'boolean',
            component: 'switch',
            label: 'Parameter settings',
            ref: 'props.autoHoltWinters',
            options: [{
              value: true,
              label: 'Auto',
            }, {
              value: false,
              label: 'Custom',
            }],
            defaultValue: true,
            show: (data) => {
              return [30].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          holtWintersAlpha: {
            ref: 'props.holtWintersAlpha',
            label: 'Alpha',
            type: 'integer',
            defaultValue: 1,
            show: (data) => {
              return [30].indexOf(data.props.analysisTypeId) >= 0 && data.props.autoHoltWinters === false;
            },
          },
          holtWintersBeta: {
            ref: 'props.holtWintersBeta',
            label: 'Beta',
            type: 'integer',
            defaultValue: 1,
            show: (data) => {
              return [30].indexOf(data.props.analysisTypeId) >= 0 && data.props.autoHoltWinters === false;
            },
          },
          holtWintersGamma: {
            ref: 'props.holtWintersGamma',
            label: 'Alpha',
            type: 'integer',
            defaultValue: 1,
            show: (data) => {
              return [30].indexOf(data.props.analysisTypeId) >= 0 && data.props.autoHoltWinters === false;
            },
          },
          // ARIMA and Holt-Winters
          seasonal: {
            type: 'string',
            component: 'dropdown',
            label: 'Seasonal',
            ref: 'props.seasonal',
            options: [{
              value: 'mult',
              label: 'Multiplicative',
            }, {
              value: 'additive',
              label: 'Additive',
            }],
            defaultValue: 'additive',
            show: (data) => {
              return [8, 30].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          // Text mining / Wordcloud
          numOfFrequentTerms: {
            ref: 'props.numOfFrequentTerms',
            label: 'Show top N frequent terms',
            type: 'integer',
            defaultValue: 50,
            show: (data) => {
              return [13].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          tolower: {
            type: 'string',
            component: 'switch',
            label: 'Convert to lower case',
            ref: 'props.tolower',
            options: [{
              value: 'FALSE',
              label: 'Off',
            }, {
              value: 'TRUE',
              label: 'On',
            }],
            defaultValue: 'TRUE',
            show: (data) => {
              return [13].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          removeNumbers: {
            type: 'string',
            component: 'switch',
            label: 'Remove numbers',
            ref: 'props.removeNumbers',
            options: [{
              value: 'FALSE',
              label: 'Off',
            }, {
              value: 'TRUE',
              label: 'On',
            }],
            defaultValue: 'TRUE',
            show: (data) => {
              return [13].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          stopwords: {
            type: 'string',
            component: 'switch',
            label: 'Remove English common stepwords',
            ref: 'props.stopwords',
            options: [{
              value: 'FALSE',
              label: 'Off',
            }, {
              value: 'TRUE',
              label: 'On',
            }],
            defaultValue: 'TRUE',
            show: (data) => {
              return [13].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          removePunctuation: {
            type: 'string',
            component: 'switch',
            label: 'Remove punctuations',
            ref: 'props.removePunctuation',
            options: [{
              value: 'FALSE',
              label: 'Off',
            }, {
              value: 'TRUE',
              label: 'On',
            }],
            defaultValue: 'TRUE',
            show: (data) => {
              return [13].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          stemming: {
            type: 'string',
            component: 'switch',
            label: 'Text stemming',
            ref: 'props.stemming',
            options: [{
              value: 'FALSE',
              label: 'Off',
            }, {
              value: 'TRUE',
              label: 'On',
            }],
            defaultValue: 'TRUE',
            show: (data) => {
              return [13].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          // Decision tree
          rpartMethod: {
            type: 'string',
            component: 'dropdown',
            label: 'Method',
            ref: 'props.rpartMethod',
            options: [{
              value: 'class',
              label: 'Class',
            }, {
              value: 'anova',
              label: 'Anova',
            }],
            defaultValue: 'class',
            show: (data) => {
              return [25, 26].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          minSplit: {
            ref: 'props.minSplit',
            label: 'Minimum split',
            type: 'integer',
            defaultValue: 20,
            show: (data) => {
              return [25, 26].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          minBucket: {
            ref: 'props.minBucket',
            label: 'Minimum bucket',
            type: 'integer',
            defaultValue: 6,
            show: (data) => {
              return [25, 26].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          cp: {
            ref: 'props.cp',
            label: 'Complexity parameter(cp)',
            type: 'number',
            defaultValue: 0.01,
            show: (data) => {
              return [25, 26].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          maxDepth: {
            ref: 'props.maxDepth',
            label: 'Max depth',
            type: 'integer',
            defaultValue: 30,
            show: (data) => {
              return [25, 26].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          defaultCollapseLevel: {
            ref: 'props.defaultCollapseLevel',
            label: 'Default Collapse Level',
            type: 'integer',
            defaultValue: 3,
            show: (data) => {
              return [25].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          displayResultsOnAllNodes: {
            type: 'boolean',
            component: 'switch',
            label: 'Display results on all nodes',
            ref: 'props.displayResultsOnAllNodes',
            options: [{
              value: true,
              label: 'On',
            }, {
              value: false,
              label: 'Off',
            }],
            defaultValue: false,
            show: (data) => {
              return [25].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          calcOddsRatio: {
            type: 'boolean',
            component: 'switch',
            label: 'Calculate odds ratio',
            ref: 'props.calcOddsRatio',
            options: [{
              value: true,
              label: 'On',
            }, {
              value: false,
              label: 'Off',
            }],
            defaultValue: true,
            show: (data) => {
              return [29].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          splitDataset: {
            type: 'boolean',
            component: 'switch',
            label: 'Split into training and test datasets',
            ref: 'props.splitDataset',
            options: [{
              value: true,
              label: 'On',
            }, {
              value: false,
              label: 'Off',
            }],
            defaultValue: false,
            show: (data) => {
              return [25, 27, 29].indexOf(data.props.analysisTypeId) >= 0;
            },
          },
          splitPercentage: {
            ref: 'props.splitPercentage',
            label: 'Treat first N% records as training dataset',
            type: 'number',
            min: 0.01,
            max: 0.99,
            defaultValue: 0.8,
            show: (data) => {
              return ([25, 27, 29].indexOf(data.props.analysisTypeId) >= 0 && data.props.splitDataset === true) || ([26, 28].indexOf(data.props.analysisTypeId) >= 0);
            },
          },
          // *****
          // Analysis Options
          // *****
          debugMode: {
            type: 'boolean',
            component: 'switch',
            label: 'Debug mode',
            ref: 'props.debugMode',
            options: [{
              value: false,
              label: 'Off',
            }, {
              value: true,
              label: 'On',
            }],
            defaultValue: false,
            show: (data) => {
              return (enableDebugMode);
            },
          },
          debugModeLink: {
            label: 'What is debug mode?',
            component: 'link',
            url: 'https://github.com/mhamano/advanced-analytics-toolbox/blob/master/docs/debugmode.md',
            show: (data) => {
              return (enableDebugMode);
            },
          },
        },
      },
      settings: {
        uses: 'settings',
        items: {
          presentation: {
            type: 'items',
            label: 'Presentation',
            items: {
              line: {
                type: 'string',
                component: 'dropdown',
                ref: 'props.line',
                options: [{
                  value: 'none',
                  label: 'Line',
                }, {
                  value: 'tozeroy',
                  label: 'Area',
                }],
                defaultValue: 'none',
                show: (data) => {
                  return [0, 6, 8, 9, 17, 20, 30].indexOf(data.props.analysisTypeId) >= 0;
                },
              },
              datapoints: {
                type: 'boolean',
                label: 'Show data points',
                ref: 'props.datapoints',
                defaultValue: false,
                show: (data) => {
                  return [0, 6, 8, 9, 17, 20, 30].indexOf(data.props.analysisTypeId) >= 0;
                },
              },
              borderWidth: {
                type: 'number',
                component: 'slider',
                label: 'Border Width',
                ref: 'props.borderWidth',
                min: 0,
                max: 10,
                step: 1,
                defaultValue: 1,
                show: (data) => {
                  return [0, 6, 8, 9, 15, 17, 20, 29, 30].indexOf(data.props.analysisTypeId) >= 0;
                },
              },
              pointRadius: {
                type: 'number',
                component: 'slider',
                label: 'Point Radius',
                ref: 'props.pointRadius',
                min: 1,
                max: 10,
                step: 1,
                defaultValue: 6,
                show: (data) => {
                  return [0, 6, 8, 9, 15, 17, 20, 29, 30].indexOf(data.props.analysisTypeId) >= 0;
                },
              },
              bubbleSize: {
                type: 'number',
                component: 'slider',
                label: 'Bubble Size',
                ref: 'props.bubbleSize',
                min: 0,
                max: 50,
                step: 1,
                defaultValue: 12,
                show: (data) => {
                  return [1, 10, 16, 19, 25].indexOf(data.props.analysisTypeId) >= 0;
                },
              },
              marginTop: {
                type: 'number',
                component: 'slider',
                label: 'Margin top',
                ref: 'props.marginTop',
                min: 0,
                max: 200,
                step: 1,
                defaultValue: 10,
                show: (data) => {
                  return [0, 1, 6, 8, 9, 10, 14, 15, 16, 17, 19, 20, 23, 24, 29, 30].indexOf(data.props.analysisTypeId) >= 0;
                },
              },
              marginBottom: {
                type: 'number',
                component: 'slider',
                label: 'Margin bottom',
                ref: 'props.marginBottom',
                min: 0,
                max: 200,
                step: 1,
                defaultValue: 10,
                show: (data) => {
                  return [0, 1, 6, 8, 9, 10, 14, 15, 16, 17, 19, 20, 23, 24, 29, 30].indexOf(data.props.analysisTypeId) >= 0;
                },
              },
              marginRight: {
                type: 'number',
                component: 'slider',
                label: 'Margin right',
                ref: 'props.marginRight',
                min: 0,
                max: 200,
                step: 1,
                defaultValue: 10,
                show: (data) => {
                  return [0, 1, 6, 8, 9, 10, 14, 15, 16, 17, 19, 20, 23, 24, 29, 30].indexOf(data.props.analysisTypeId) >= 0;
                },
              },
              marginLeft: {
                type: 'number',
                component: 'slider',
                label: 'Margin left',
                ref: 'props.marginLeft',
                min: 0,
                max: 200,
                step: 1,
                defaultValue: 10,
                show: (data) => {
                  return [0, 1, 6, 8, 9, 10, 14, 15, 16, 17, 19, 20, 23, 24, 29, 30].indexOf(data.props.analysisTypeId) >= 0;
                },
              },
              defineScreenSize: {
                type: 'boolean',
                component: 'switch',
                label: 'Screen size',
                ref: 'props.defineScreenSize',
                options: [{
                  value: true,
                  label: 'Auto',
                }, {
                  value: false,
                  label: 'Custom',
                }],
                defaultValue: true,
                show: (data) => {
                  return [25].indexOf(data.props.analysisTypeId) >= 0;
                },
              },
              screenWidth: {
                label: 'Width',
                ref: 'props.screenWidth',
                type: 'integer',
                defaultValue: 960,
                show: (data) => {
                  return [25].indexOf(data.props.analysisTypeId) >= 0 && data.props.defineScreenSize === false;
                },
              },
              screenHeight: {
                label: 'Height',
                ref: 'props.screenHeight',
                type: 'integer',
                defaultValue: 500,
                show: (data) => {
                  return [25].indexOf(data.props.analysisTypeId) >= 0 && data.props.defineScreenSize === false;
                },
              },
            },
          },
          colorsAndLegend: {
            type: 'items',
            label: 'Colors and legend',
            items: {
              colors: {
                type: 'boolean',
                component: 'switch',
                label: 'Colors',
                ref: 'props.colors',
                options: [{
                  value: true,
                  label: 'Auto',
                }, {
                  value: false,
                  label: 'Custom',
                }],
                defaultValue: true,
                show: (data) => {
                  return [0, 1, 6, 8, 9, 15, 17, 19, 20, 25, 29, 30].indexOf(data.props.analysisTypeId) >= 0;
                },
              },
              // colorBy: {
              //   type: 'string',
              //   component: 'dropdown',
              //   ref: 'props.colorBy',
              //   options: [{
              //     value: 'single',
              //     label: 'Single color',
              //   }, {
              //     value: 'dimension',
              //     label: 'By dimension',
              //   }],
              //   defaultValue: 'single',
              //   show: (data) => {
              //     return  [1].indexOf(data.props.analysisTypeId) >= 0 && data.props.colors === false;
              //   },
              // },
              colorForMain: {
                label: 'Color',
                component: 'color-picker',
                ref: 'props.colorForMain',
                type: 'object',
                defaultValue: {
                  index: 3,
                  color: "#4477aa"
                },
                show: (data) => {
                  return [0, 1, 6, 8, 9, 15, 17, 19, 20, 25, 29, 30].indexOf(data.props.analysisTypeId) >= 0 && data.props.colors === false;
                },
              },
              colorForSub: {
                label: 'Color (Trend/Forecast)',
                component: 'color-picker',
                ref: 'props.colorForSub',
                type: 'object',
                defaultValue: {
                  index: 7,
                  color: "#f93f17"
                },
                show: (data) => {
                  return [0, 1, 9, 17, 19, 20, 30].indexOf(data.props.analysisTypeId) >= 0 && data.props.colors === false;
                },
              },
              showLegend: {
                type: 'boolean',
                component: 'switch',
                label: 'Show legend',
                ref: 'props.showLegend',
                options: [{
                  value: true,
                  label: 'On',
                }, {
                  value: false,
                  label: 'Off',
                }],
                defaultValue: false,
                show: (data) => {
                  return [0, 1, 9, 10, 15, 16, 17, 19, 20, 24, 29, 30].indexOf(data.props.analysisTypeId) >= 0;
                },
              },
            },
          },
          xAxis: {
            type: 'items',
            label: 'X-axis',
            items: {
              xLabelsAndTitle: {
                type: 'boolean',
                label: 'Show title',
                component: 'switch',
                ref: 'props.xLabelsAndTitle',
                options: [{
                  value: true,
                  label: 'On',
                }, {
                  value: false,
                  label: 'Off',
                }],
                defaultValue: false,
                show: (data) => {
                  return [0, 1, 9, 10, 16, 17, 20, 24, 30].indexOf(data.props.analysisTypeId) >= 0;
                },
              },
              xAxisPosition: {
                type: 'string',
                label: 'Position',
                component: 'dropdown',
                ref: 'props.xAxisPosition',
                options: [{
                  value: 'bottom',
                  label: 'Bottom',
                }, {
                  value: 'top',
                  label: 'Top',
                }],
                defaultValue: 'bottom',
                show: (data) => {
                  return [0, 1, 9, 10, 15, 17, 20, 24, 29, 30].indexOf(data.props.analysisTypeId) >= 0;
                },
              },
              xScale: {
                type: 'boolean',
                component: 'switch',
                label: 'Scale',
                ref: 'props.xScale',
                options: [{
                  value: true,
                  label: 'On',
                }, {
                  value: false,
                  label: 'Off',
                }],
                defaultValue: true,
                show: (data) => {
                  return [0, 1, 6, 8, 9, 10, 15, 17, 19, 20, 24, 29, 30].indexOf(data.props.analysisTypeId) >= 0;
                },
              },
              xAxisType: {
                type: 'string',
                label: 'Axis Type',
                component: 'dropdown',
                ref: 'props.xAxisType',
                options: [{
                  value: '-',
                  label: 'Auto',
                }, {
                  value: 'linear',
                  label: 'Linear',
                }, {
                  value: 'category',
                  label: 'Category',
                }, {
                  value: 'log',
                  label: 'Log',
                }, {
                  value: 'data',
                  label: 'Date',
                }],
                defaultValue: '-',
                show: (data) => {
                  return [0, 17].indexOf(data.props.analysisTypeId) >= 0;
                },
              },
            },
          },
          yAxis: {
            type: 'items',
            label: 'Y-axis',
            items: {
              yLabelsAndTitle: {
                type: 'boolean',
                label: 'Show title',
                component: 'switch',
                ref: 'props.yLabelsAndTitle',
                options: [{
                  value: true,
                  label: 'On',
                }, {
                  value: false,
                  label: 'Off',
                }],
                defaultValue: false,
                show: (data) => {
                  return [0, 1, 9, 10, 16, 17, 20, 24, 30].indexOf(data.props.analysisTypeId) >= 0;
                },
              },
              yAxisPosition: {
                type: 'string',
                label: 'Position',
                component: 'dropdown',
                ref: 'props.yAxisPosition',
                options: [{
                  value: 'left',
                  label: 'Left',
                }, {
                  value: 'right',
                  label: 'Right',
                }],
                defaultValue: 'left',
                show: (data) => {
                  return [0, 1, 9, 10, 15, 17, 20, 24, 29, 30].indexOf(data.props.analysisTypeId) >= 0;
                },
              },
              yScale: {
                type: 'boolean',
                component: 'switch',
                label: 'Scale',
                ref: 'props.yScale',
                options: [{
                  value: true,
                  label: 'On',
                }, {
                  value: false,
                  label: 'Off',
                }],
                defaultValue: true,
                show: (data) => {
                  return [0, 1, 6, 8, 9, 10, 15, 17, 19, 24, 29, 30].indexOf(data.props.analysisTypeId) >= 0;
                },
              },
            },
          },
          zAxis: {
            type: 'items',
            label: 'Z-axis',
            show: (data) => {
              return [16].indexOf(data.props.analysisTypeId) >= 0;
            },
            items: {
              zLabelsAndTitle: {
                type: 'boolean',
                label: 'Show title',
                component: 'switch',
                ref: 'props.zLabelsAndTitle',
                options: [{
                  value: true,
                  label: 'On',
                }, {
                  value: false,
                  label: 'Off',
                }],
                defaultValue: false,
                show: (data) => {
                  return [16].indexOf(data.props.analysisTypeId) >= 0;
                },
              },
            },
          },
        },
      },
    },
  };
});
