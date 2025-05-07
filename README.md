# Pandemic Visualisation Tool

## Project Overview

This repository contains the write-up and application for my Final Year Project at Loughborough University. The project aims to create a node.js application which is able to use real pandemic data and visualise it in a useful manner.

- [Preparing the Data](#preparing-the-data)
- [Running in the node.js Runtime](#running-in-the-nodejs-runtime)
- [Deploying to a Docker container](#deploying-to-a-docker-container)
- [Accessing the Report](#accessing-the-report)

## Preparing the Data

If you're using a new dataset, the data must be cleaned before being put in the repo.
I use a Python script to achieve this, which can be found at ./App/data/restructure-json.py.
I have added the original data to the repository to use to test the script. This data is from the ECDC (European Centre for Disease Prevention and Control) and can be found [here](https://www.ecdc.europa.eu/en/covid-19/data).
You need to map the data in your JSON file to the data format I use. More information can be found in the Python file.
To run the Python script, follow:

1. Navigate to directory
`cd App/data`
2. Run the Script
`python restructure-json.py`
3. A successful run should print `Data successfully transformed and saved to 'pandemicData.json'`
4. This data is now ready to be used in the application.

## Running in the node.js Runtime

To run the application locally on a node.js runtime, follow:

1. Clone this repository:
`git clone https://github.com/MattyLake/Final-Year-Project`
2. Navigate to the App folder
`cd App`
3. Install npm dependancies
`npm install`
4. Start the node.js runtime
`npm start`
5. The application should be at `http://localhost:8080/`

## Deploying to a Docker Container

To deploy the application to a server, use the docker daemon.

1. Start the docker daemon
2. Clone this repository:
`git clone https://github.com/MattyLake/Final-Year-Project`
3. Navigate to the App folder
`cd App`
4. Build the Docker image
`docker build -t pandemic-visualiser-app .`
5. Run the Docker image
`docker run -p 8080:8080 pandemic-visualiser-app`
6. The application should be at `http://localhost:8080/`, or through a specified domain through up-porting.

## Accessing the Report

To access the report, this repository contains a .tex file, a .bib file and a fully rendered pdf, along with the images in the report.
To build the .tex file, I used the [MikTex](https://github.com/MiKTeX/miktex) LaTeX kernel which will add many more files to the respository. Refer to the .gitignore to see which files.
