export function setTimelineDate(date) {
    const dateDiv = document.getElementById('timeline-date');
    dateDiv.textContent = date;
}

export function convertDateFromSlider(sliderValue) { // Convert slider value to YYYY-WW format
    if (sliderValue <= 53 && sliderValue >= 0) { //2020
        return "2020-" + (sliderValue < 10 ? "0" + sliderValue : sliderValue);
    } else if (sliderValue <= 105 && sliderValue >= 53) { //2021
        return "2021-" + ((sliderValue-53) < 10 ? "0" + (sliderValue-53) : (sliderValue-53));
    } else { //2022
        return "2022-" + ((sliderValue-105) < 10 ? "0" + (sliderValue-105) : (sliderValue-105));
    }
}