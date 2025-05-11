export async function loadPandemicDataForCountry(countryCode) {
    return d3.json("data/pandemicData").then(function(data) {
        if (data[countryCode]) {
            return data[countryCode];
        } else {
            console.error('Data not found for the given country code');
            return null;
        }
    }).catch(function(error) { 
        console.error('Error loading or parsing data:', error);
        throw error;
    });
}

export async function getUniqueDataKeys() {
    return d3.json("data/pandemicData").then(function(data) {
        const keys = Object.keys(data[Object.keys(data)[0]].data);
        return keys;
    }).catch(function(error) { 
        console.error('Error loading or parsing data:', error);
        throw error;
    });
}