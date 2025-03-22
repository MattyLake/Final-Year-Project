export async function loadData(countryCode, timestamp) {
    return d3.json("data/pandemicData").then(function(data) {
        if (data[countryCode] && data[countryCode].data[timestamp]) {
            return {
                cases: data[countryCode].data[timestamp].cases,
                deaths: data[countryCode].data[timestamp].deaths,
                susceptible: data[countryCode].properties.population - data[countryCode].data[timestamp].cases - data[countryCode].data[timestamp].deaths
            };
        } else {
            throw new Error('Data not found for the given country code and timestamp');
        }
    }).catch(function(error) { 
        console.error('Error loading or parsing data:', error);
        throw error;
    });
}