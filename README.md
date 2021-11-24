REST API for Web Development 2 practical 7
=======================

The API has 4 endpoints managing a database with cities, one for each CRUDE operation:
- addCity/ -- HTTP POST with `Name`, `Code`, `District` and `Population` being present in the body of the request
- getCity/:cityName -- HTTP GET with `cityName` as the parameter
- updateCity/ -- HTTP POST with `Population` being present in the body of the request
- deleteCity/:cityName -- HTTP GET with `cityName` as the parameter
