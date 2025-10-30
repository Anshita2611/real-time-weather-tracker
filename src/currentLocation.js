import React from "react";
import apiKeys from "./apiKeys";
import Clock from "react-live-clock";
import Forcast from "./forcast";
import loader from "./images/WeatherIcons.gif";
import ReactAnimatedWeather from "react-animated-weather";
const dateBuilder = (d) => {
  let months = [
    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",
  ];
  let days = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
  ];

  let day = days[d.getDay()];
  let date = d.getDate();
  let month = months[d.getMonth()];
  let year = d.getFullYear();

  return `${day}, ${date} ${month} ${year}`;
};
const defaults = {
  color: "white",
  size: 112,
  animate: true,
};
class Weather extends React.Component {
  state = {
    lat: undefined,
    lon: undefined,
    errorMessage: undefined,
    temperatureC: undefined,
    temperatureF: undefined,
    city: undefined,
    country: undefined,
    humidity: undefined,
    description: undefined,
    icon: "CLEAR_DAY",
    sunrise: undefined,
    sunset: undefined,
    errorMsg: undefined,
  };

  componentDidMount() {
    if (navigator.geolocation) {
      this.getPosition({enableHighAccuracy: true, timeout: 10000, maximumAge: 0})
        //If user allow location service then will fetch data & send it to get-weather function.
        .then(async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const cityName = await this.getCityName(lat, lon);
          this.getWeather(lat, lon, cityName);
        })
        .catch((err) => {
          this.setState({errorMsg: 'Location access denied. Please allow location access in your browser and refresh the page.'});
        });
    } else {
      this.setState({errorMsg: 'Geolocation not available in your browser.'});
    }

    this.timerID = setInterval(
      () => this.getWeather(this.state.lat, this.state.lon),
      600000
    );
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  // tick = () => {
  //   this.getPosition()
  //   .then((position) => {
  //     this.getWeather(position.coords.latitude, position.coords.longitude)
  //   })
  //   .catch((err) => {
  //     this.setState({ errorMessage: err.message });
  //   });
  // }

  getPosition = (options) => {
    return new Promise(function (resolve, reject) {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  };

  getCityName = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
      );
      const data = await response.json();
      const city = data.address.city || data.address.town || data.address.village;
      if (city) {
        return city;
      } else {
        // Fallback to first part of display_name, taking only the main name
        const displayParts = data.display_name.split(',');
        return displayParts[0].split(' ')[0]; // Take first word to avoid long names like "Jaipur Municipal Corporation"
      }
    } catch (error) {
      console.error('Error fetching city name:', error);
      return null;
    }
  };
  getWeather = async (lat, lon, cityName = null) => {
    const api_call = await fetch(
      `${apiKeys.base}weather?lat=${lat}&lon=${lon}&units=metric&APPID=${apiKeys.key}`
    );
    const data = await api_call.json();
    if (api_call.ok && data.cod === 200) {
      const mainWeather = data.weather[0].main;
      let icon = "CLEAR_DAY";
      switch (mainWeather) {
        case "Haze":
          icon = "CLEAR_DAY";
          break;
        case "Clouds":
          icon = "CLOUDY";
          break;
        case "Rain":
          icon = "RAIN";
          break;
        case "Snow":
          icon = "SNOW";
          break;
        case "Dust":
          icon = "WIND";
          break;
        case "Drizzle":
          icon = "SLEET";
          break;
        case "Fog":
          icon = "FOG";
          break;
        case "Smoke":
          icon = "FOG";
          break;
        case "Tornado":
          icon = "WIND";
          break;
        default:
          icon = "CLEAR_DAY";
      }
      this.setState({
        lat: lat,
        lon: lon,
        city: cityName || data.name,
        temperatureC: Math.round(data.main.temp),
        humidity: data.main.humidity,
        main: mainWeather,
        country: data.sys.country,
        icon: icon,
        errorMsg: undefined,
      });
    } else {
      this.setState({
        errorMsg: data.message || "Failed to fetch weather data",
      });
    }
  };

  render() {
    if (this.state.errorMsg) {
      return (
        <React.Fragment>
          <h3 style={{ color: "red", fontSize: "22px", fontWeight: "600" }}>
            Error: {this.state.errorMsg}
          </h3>
        </React.Fragment>
      );
    } else if (this.state.temperatureC) {
      return (
        <React.Fragment>
          <div className="city">
            <div className="title">
              <h2>{this.state.city}</h2>
              <h3>{this.state.country}</h3>
            </div>
            <div className="mb-icon">
              {" "}
              <ReactAnimatedWeather
                icon={this.state.icon}
                color={defaults.color}
                size={defaults.size}
                animate={defaults.animate}
              />
              <p>{this.state.main}</p>
            </div>
            <div className="date-time">
              <div className="dmy">
                <div id="txt"></div>
                <div className="current-time">
                  <Clock format="HH:mm:ss" interval={1000} ticking={true} />
                </div>
                <div className="current-date">{dateBuilder(new Date())}</div>
              </div>
              <div className="temperature">
                <p>
                  {this.state.temperatureC}°<span>C</span>
                </p>
              </div>
            </div>
          </div>
          <Forcast icon={this.state.icon} weather={this.state.main} />
        </React.Fragment>
      );
    } else {
      return (
        <React.Fragment>
          <img src={loader} style={{ width: "50%", WebkitUserDrag: "none" }} />
          <h3 style={{ color: "white", fontSize: "22px", fontWeight: "600" }}>
            Detecting your location
          </h3>
          <h3 style={{ color: "white", marginTop: "10px" }}>
            Your current location wil be displayed on the App <br></br> & used
            for calculating Real time weather.
          </h3>
        </React.Fragment>
      );
    }
  }
}

export default Weather;
