"""
weather_service.py — Real-time weather from Open-Meteo API
No API key needed | Free | Covers all Bugesera sectors
"""
import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
from datetime import datetime, timedelta
from functools import lru_cache
import time

# ── Bugesera sector GPS coordinates ──────────────────────────────────────────
SECTOR_COORDS = {
    'Gashora':    {'lat': -2.1167, 'lon': 30.0833},
    'Juru':       {'lat': -2.0833, 'lon': 30.1167},
    'Kamabuye':   {'lat': -2.1500, 'lon': 30.1500},
    'Mareba':     {'lat': -2.0500, 'lon': 30.0500},
    'Mayange':    {'lat': -2.0167, 'lon': 30.0167},
    'Musenyi':    {'lat': -2.2000, 'lon': 30.1000},
    'Mwogo':      {'lat': -2.1833, 'lon': 30.0667},
    'Ngeruka':    {'lat': -2.0333, 'lon': 30.1333},
    'Ntarama':    {'lat': -2.0667, 'lon': 30.0833},
    'Nyamata':    {'lat': -2.1500, 'lon': 30.0833},
    'Nyarugenge': {'lat': -2.1000, 'lon': 30.0500},
    'Rilima':     {'lat': -2.2167, 'lon': 30.1333},
    'Ruhuha':     {'lat': -2.0833, 'lon': 30.1500},
    'Rweru':      {'lat': -2.2500, 'lon': 30.1667},
    'Shyara':     {'lat': -2.1333, 'lon': 30.1167},
}

# Cache weather data for 1 hour to avoid too many API calls
_weather_cache = {}
_cache_ttl = 3600  # 1 hour

def get_real_weather(sector: str, planting_date: str = None) -> dict:
    """
    Fetch real weather from Open-Meteo for a given sector.
    Returns seasonal aggregates matching our model features.
    Falls back to historical averages if API fails.
    """
    coords = SECTOR_COORDS.get(sector, SECTOR_COORDS['Gashora'])
    lat, lon = coords['lat'], coords['lon']

    # Check cache
    cache_key = f"{sector}_{datetime.now().strftime('%Y%m%d%H')}"
    if cache_key in _weather_cache:
        cached = _weather_cache[cache_key]
        if time.time() - cached['_fetched_at'] < _cache_ttl:
            return cached

    try:
        # Open-Meteo: use past_days + forecast_days (simpler, no date range issues)
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude"      : lat,
            "longitude"     : lon,
            "daily"         : [
                "precipitation_sum",
                "temperature_2m_max",
                "temperature_2m_min",
                "relative_humidity_2m_max",
                "relative_humidity_2m_min",
                "sunshine_duration",
                "wind_speed_10m_max",
                "et0_fao_evapotranspiration",
            ],
            "timezone"      : "Africa/Kigali",
            "past_days"     : 30,
            "forecast_days" : 7,
        }

        resp = requests.get(url, params=params, timeout=8, verify=False)
        resp.raise_for_status()
        data = resp.json()
        daily = data.get('daily', {})

        # ── Aggregate to seasonal values ──────────────────────────────────────
        rain_list  = [v for v in daily.get('precipitation_sum', []) if v is not None]
        tmax_list  = [v for v in daily.get('temperature_2m_max', []) if v is not None]
        tmin_list  = [v for v in daily.get('temperature_2m_min', []) if v is not None]
        hmax_list  = [v for v in daily.get('relative_humidity_2m_max', []) if v is not None]
        hmin_list  = [v for v in daily.get('relative_humidity_2m_min', []) if v is not None]
        sun_list   = [v/3600 for v in daily.get('sunshine_duration', []) if v is not None]  # sec→hrs
        wind_list  = [v for v in daily.get('wind_speed_10m_max', []) if v is not None]
        et_list    = [v for v in daily.get('et0_fao_evapotranspiration', []) if v is not None]

        def safe_avg(lst): return round(sum(lst)/len(lst), 2) if lst else None
        def safe_sum(lst): return round(sum(lst), 1) if lst else None

        result = {
            'source'                  : 'open-meteo-live',
            'sector'                  : sector,
            'fetched_at'              : datetime.now().isoformat(),
            'Total_Rainfall_mm'       : safe_sum(rain_list),
            'Avg_Temperature_Celsius' : round((safe_avg(tmax_list) + safe_avg(tmin_list)) / 2, 1)
                                        if tmax_list and tmin_list else None,
            'Relative_Humidity_Pct'   : round((safe_avg(hmax_list) + safe_avg(hmin_list)) / 2, 1)
                                        if hmax_list and hmin_list else None,
            'Sunshine_Hours_per_Day'  : safe_avg(sun_list),
            'Wind_Speed_kmh'          : safe_avg(wind_list),
            'Evapotranspiration_mm'   : safe_sum(et_list),
            '_fetched_at'             : time.time(),
        }

        # Cache it
        _weather_cache[cache_key] = result
        print(f"  [weather] Live data fetched for {sector}: "
              f"rain={result['Total_Rainfall_mm']}mm "
              f"temp={result['Avg_Temperature_Celsius']}°C")
        return result

    except Exception as e:
        print(f"  [weather] Open-Meteo failed for {sector}: {e} — using historical fallback")
        return _historical_fallback(sector, planting_date)


def _historical_fallback(sector: str, planting_date: str = None) -> dict:
    """Return Bugesera historical averages when API is unavailable."""
    BUGESERA_CLIMATE = {
        1:  {'temp':22.4,'rain':66, 'hum':72,'sun':7.8,'wind':11.2,'et':108},
        2:  {'temp':22.8,'rain':72, 'hum':73,'sun':7.6,'wind':11.0,'et':110},
        3:  {'temp':23.1,'rain':95, 'hum':76,'sun':7.2,'wind':10.8,'et':112},
        4:  {'temp':23.5,'rain':108,'hum':79,'sun':6.8,'wind':10.4,'et':106},
        5:  {'temp':23.2,'rain':78, 'hum':77,'sun':7.0,'wind':10.6,'et':104},
        6:  {'temp':22.9,'rain':35, 'hum':68,'sun':8.2,'wind':12.1,'et':116},
        7:  {'temp':22.5,'rain':28, 'hum':64,'sun':8.6,'wind':12.8,'et':120},
        8:  {'temp':23.0,'rain':42, 'hum':66,'sun':8.4,'wind':12.4,'et':118},
        9:  {'temp':23.6,'rain':78, 'hum':74,'sun':7.4,'wind':11.6,'et':114},
        10: {'temp':23.8,'rain':110,'hum':80,'sun':6.6,'wind':10.2,'et':102},
        11: {'temp':23.4,'rain':102,'hum':78,'sun':7.0,'wind':10.6,'et':105},
        12: {'temp':22.6,'rain':85, 'hum':74,'sun':7.5,'wind':11.4,'et':109},
    }
    try:
        month = datetime.strptime(planting_date, '%Y-%m-%d').month if planting_date else datetime.now().month
    except:
        month = datetime.now().month

    c = BUGESERA_CLIMATE.get(month, BUGESERA_CLIMATE[10])
    return {
        'source'                  : 'historical-fallback',
        'sector'                  : sector,
        'fetched_at'              : datetime.now().isoformat(),
        'Total_Rainfall_mm'       : c['rain'] * 5,   # monthly → seasonal
        'Avg_Temperature_Celsius' : c['temp'],
        'Relative_Humidity_Pct'   : c['hum'],
        'Sunshine_Hours_per_Day'  : c['sun'],
        'Wind_Speed_kmh'          : c['wind'],
        'Evapotranspiration_mm'   : c['et'] * 5,
        '_fetched_at'             : time.time(),
    }


def get_weather_for_prediction(sector: str, planting_date: str = None) -> dict:
    """
    Main function called by predict endpoint.
    Returns weather dict ready to merge with farmer inputs.
    """
    weather = get_real_weather(sector, planting_date)
    # Remove internal fields
    return {k: v for k, v in weather.items() if not k.startswith('_')}
