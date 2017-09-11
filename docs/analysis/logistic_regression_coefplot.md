# Logistic regression - Plot coefficients
Plots the coefficients from a regression model.

## Screenshot
  ![coef example1](./images/logistic_regression_coefplot_example2-1.png)

## Prerequisite R packages

## Used R command
 * [lm](https://www.rdocumentation.org/packages/stats/versions/3.4.0/topics/lm)
 * [coef](https://www.rdocumentation.org/packages/stats/versions/3.4.1/topics/coef)

## Caution
  * Number formatting settings on measure properties are ignored.
  * Selections on the chart is disabled.

## Usage
  1. Place [Advanced Analytics Toolbox] extension on a sheet and select [Classification] > [Logistic regression - Plot coefficients] for [Analysis Type].
  2. Select dimensions and measures.
  * Dimension: A field uniquely identifies each record (ex: ID, Code)
  * Measure 1: Response variable
  * Measure 2-: Predictor variables

## Options
* Calculate odds ratio -  When turned on, odds ratio is calculated and displayed (Exponentiated coefficients are calculated)
* Split into training and test datasets - When turned on, the input data is split into training and test datasets.
* Treat first N% records as training dataset - When "Split into training and test datasets" is turned on, the percentage of the first records specified here is treated as training data, and the rest is treated as test data.

## Example1 - Customer Churn Data
 1. Follow the instruction of example 2 explained on [Logistic regression analysis](./logistic_regression.md). Select [Classification] > [Logistic regression - Plot coefficients] for [Analysis Type]. Open [Appearance] > [Presentation] on the property panel and adjust the margins.
 2. The odds ratio from the Multiple regression model are plotted on the chart. The chart visually shows that when "number_customer_service_calls" value increased by one unit, the probability for the customer to churn increase by 57% (1.5739). On the other hand, the probability for customer to churn is approximately 1/3 (0.383) when a customer purchases "voice_mail_plan", compared with the case when the customer did not purchase the plan.
   ![logistic regression predict example1](./images/logistic_regression_coefplot_example2-1.png)
 3. Turn off the [Calculate odds ration] option from [Analysis Settings] on the property panel, and coefficients are displayed instead of odds ration.
