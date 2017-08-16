# Developer notes
This page includes notes on how to setup project and modify codes of 'advanced-analytics-toolbox'.

## Setting up project
 1. Clone 'advanced-analytics-toolbox' github project under 'C:\Users\%username%\Documents\Qlik\Sense\Extensions' folder.
 2. Start command prompt, move to the cloned project directory and execute the following command to install the required node modules for development.

 `npm install`

 `npm install -g gulp`

## Working on the development
  1. Start command prompt, move to the project directory and execute the following command.

  `gulp watch`

  2. Make modifications on the source code under the 'src' directory. The modifications are synced to the codes under the 'build/dev' directory after performing gulp tasks such as transcompiling, minification, etc, and the modifications are reflected to the extension.

## Adding a new analysis type
  1. Add an entry to analysisTypes in 'src/lib/js/analysis/analysis.js' file.

          {
            id: 11,
            category: 1,
            name: 'Multiple regression analysis',
            file: 'regression_analysis',
            minDims: 1,
            minMeas: 2,
            sortId: 1,
            allowAddMea: true,
            setCustomButtonLabel: true,
            dimButtonLabel: ['Add dimension'],
            meaButtonLabel: ['Add measure - Response variable', 'Add measure - Predictor variable'],
            meaButtonLabelOthers: 'Add measure - Predictor variable',
          },

  The above is a sample of an entry where:
    * id - unique ID.
    * category - ID of the analysis category (define in 'analysisCategories') the analysis type belongs to.
    * name - Name of the analysis type.
    * file - File name for the analysis type
    * minDims - Minimum number of dimensions
    * minMeas - Minimum number of measures
    * sortId - The analysis type entries are displayed in sort order by this id among a analysis categories
    * allowAddMea - If set true, it is allowed to add measures by pressing [+] button
    * setCustomButtonLabel - If set true, the labels of add dimension and measure buttons can be customized
    * dimButtonLabel - Specify the custom label of add dimension button when setCustomButtonLabel is set to true
    * meaButtonLabel - Specify the custom label of add measure button when setCustomButtonLabel is set to true
    * meaButtonLabelOthers - Specify the custom label of add measure button added by [+] button when allowAddMea and setCustomButtonLabel are set to true

  2. Add a file to 'src/lib/js/analysis/' directory. File name should match to the one specified to 'file' of the analysis type definition in 'src/lib/js/analysis/analysis.js' file. (Need to add .js extension) This file should contains codes for the analysis type.

  3.  Add a file to 'docs/analysis/' directory. File name should match to the one specified to 'file' of the analysis type definition in 'src/lib/js/analysis/analysis.js' file. (Need to add .md extension) This file is the help documentation for the analysis type. Related sample datasets and image files are placed under 'docs/analysis/data' and 'docs/analysis/images' respectively.

  4. When a new chart is added, its code should be placed under 'src/lib/js/chart/' directory.

## Rebuilding build/dev directory
  1. You are able to clean 'build/dev' directory by executing the following command.

    `gulp clean`

  2. You are able to sync all codes from 'src' to 'build/dev' directory by executing the following command.

    `gulp`

## Changing the release version
  1. Update the 'version' in the following files:
   * package.json
   * src/advanced-analytics-toolbox.qext

## Creating a zip file for a new release
  1. Start command prompt, move to the project directory and execute the following command.

    `gulp release`

  2. You will be able to find 'advanced-analytics-toolbox-[version].zip' file under 'build/release' directory.

## Adding a tag to a commit for a new release (on GuiHub Desktop)
  1. On the 'History' tab, select a commit and copy SHA checksum.
  2. Select [Repository] > [Open command prompt] from the menu.
  3. Execute the following command

    `git tag -a [tag name] -m "message" [SHA checksum]`

    ex) git tag -a v.1.0.0 -m "v1.0.0" ace6b3e

  4. List tags

    `git tag`

  5. Push tag to origin

    `git push origin [tag name]`
