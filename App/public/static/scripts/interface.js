// export async function loadData(state) {
//     let currentDate = state.date;
//     let countryCode = state.country.datum().properties.iso_a3;

//     return d3.json("data/pandemicData").then(function(data) {
//         if (data[countryCode] && data[countryCode].data[currentDate]) {
//             return {
//                 cases: data[countryCode].data[currentDate].cases,
//                 deaths: data[countryCode].data[currentDate].deaths,
//                 susceptible: data[countryCode].properties.population
//                             - data[countryCode].data[currentDate].cases
//                             - data[countryCode].data[currentDate].deaths
//             };
//         } else {
//             console.error('Data not found for the given country code and timestamp');
//             return null;
//         }
//     }).catch(function(error) { 
//         console.error('Error loading or parsing data:', error);
//         throw error;
//     });
// }

// export async function loadAllData() {
//     return d3.json("data/pandemicData").then(function(data) {
//         return data;
//     }).catch(function(error) { 
//         console.error('Error loading or parsing data:', error);
//         throw error;
//     });
// }


// Returns all data for a given country code
// The data is returned in the format {cases, deaths, susceptible}
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

//
export async function getUniqueDataKeys() {
    return d3.json("data/pandemicData").then(function(data) {
        const keys = Object.keys(data[Object.keys(data)[0]].data);
        return keys;
    }).catch(function(error) { 
        console.error('Error loading or parsing data:', error);
        throw error;
    });
}