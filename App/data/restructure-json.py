import json
from collections import defaultdict

#####################################################
#ENTER UNCLEANED JSON FILE, e.g. "data.json"
oldJSONFile = "data.json"
#####################################################

# Load JSON data from file
with open(oldJSONFile, "r", encoding="utf-8") as infile:
    json_data = json.load(infile)

# Data structure to hold per-country data
countries = defaultdict(lambda: {
    "properties": {},
    "data": defaultdict(lambda: {
        "cases": 0,
        "deaths": 0,
        "cumulative_cases": 0,
        "cumulative_deaths": 0,
        "rate_14_day_cases": 0.0,
        "rate_14_day_deaths": 0.0
    })
})

# Initialize global totals
world_totals = defaultdict(lambda: {
    "cases": 0,
    "deaths": 0,
    "cumulative_cases": 0,
    "cumulative_deaths": 0
})
world_population = 0  # We will sum all populations

for entry in json_data:
    country = entry.get("country", "Unknown")
    country_code = entry.get("country_code", "N/A")
    
    # Populate country properties once
    if not countries[country_code]["properties"]:
        countries[country_code]["properties"] = {
            "country": country,
            "country_code": country_code,
            "continent": entry.get("continent", "Unknown"),
            "population": entry.get("population", 0),
            "source": entry.get("source", "Unknown")
        }
        world_population += entry.get("population", 0)  # Sum global population

    # Use the original year_week format (YYYY-WW)
    year_week = entry.get("year_week", "Unknown")

    # Extract indicator and values
    indicator = entry.get("indicator", "").lower()
    weekly_count = entry.get("weekly_count", 0)
    cumulative_count = entry.get("cumulative_count", 0)
    rate_14_day = entry.get("rate_14_day", 0.0)

    ########################################################################################
    # AMMEND THIS AREA TO FIX TO YOUR OWN JSON FILE
    
    # Store values based on indicator type
    if indicator == "cases":
        countries[country_code]["data"][year_week]["cases"] = weekly_count
        countries[country_code]["data"][year_week]["cumulative_cases"] = cumulative_count
        countries[country_code]["data"][year_week]["rate_14_day_cases"] = rate_14_day

        # Add to world totals
        world_totals[year_week]["cases"] += weekly_count
        world_totals[year_week]["cumulative_cases"] += cumulative_count

    elif indicator == "deaths":
        countries[country_code]["data"][year_week]["deaths"] = weekly_count
        countries[country_code]["data"][year_week]["cumulative_deaths"] = cumulative_count
        countries[country_code]["data"][year_week]["rate_14_day_deaths"] = rate_14_day

        # Add to world totals
        world_totals[year_week]["deaths"] += weekly_count
        world_totals[year_week]["cumulative_deaths"] += cumulative_count


    ########################################################################################
        
# Add global totals as a "World" entry
countries["WORLD"] = {
    "properties": {
        "country": "World",
        "country_code": "WORLD",
        "continent": "Earth",
        "population": world_population,
        "source": "Aggregated Data"
    },
    "data": world_totals
}

# Convert defaultdict to normal dict for JSON output
final_result = {country_code: {"properties": data["properties"], "data": dict(data["data"])} 
                for country_code, data in countries.items()}

# Write output to a new JSON file
with open("pandemicData.json", "w", encoding="utf-8") as outfile:
    json.dump(final_result, outfile, indent=4)

print("Data successfully transformed and saved to 'pandemicData.json'")
