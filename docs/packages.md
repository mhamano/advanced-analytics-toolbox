# Required R packages
The following R packages need to be installed for this extension.

 * jsonlite
 * tseries
 * forecast
 * tm
 * dplyr
 * SnowballC
 * cluster
 * rpart
 * d3r
 * partykit

Execute the following commands to install the packages.

* When R is installed to default installation path

      install.packages("jsonlite");
      install.packages("tseries");
      install.packages("forecast");
      install.packages("tm");
      install.packages("dplyr");
      install.packages("SnowballC");
      install.packages("cluster");
      install.packages("rpart");
      install.packages("d3r");
      install.packages("partykit");

* When R is installed to a custom installation path. Following is the case when R is installed user C:\R\ instead of the default installation path of C:\Program Files\. Modify the path depending on your environment.

      install.packages("jsonlite", lib = "C:\\R\\R-3.4.1\\library");
      install.packages("tseries", lib = "C:\\R\\R-3.4.1\\library");
      install.packages("forecast", lib = "C:\\R\\R-3.4.1\\library");
      install.packages("tm", lib = "C:\\R\\R-3.4.1\\library");
      install.packages("dplyr", lib = "C:\\R\\R-3.4.1\\library");
      install.packages("SnowballC", lib = "C:\\R\\R-3.4.1\\library");
      install.packages("cluster", lib = "C:\\R\\R-3.4.1\\library");
      install.packages("rpart", lib = "C:\\R\\R-3.4.1\\library");
      install.packages("d3r", lib = "C:\\R\\R-3.4.1\\library");
      install.packages("partykit", lib = "C:\\R\\R-3.4.1\\library");
