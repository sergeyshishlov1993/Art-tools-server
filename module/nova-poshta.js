const axios = require("axios");

const apiKey = "e9c3b2475b54bc1d3033f11ad5b20c26";
const baseUrl = "https://api.novaposhta.ua/v2.0/json/";

async function getCities() {
  try {
    const response = await axios.post(baseUrl, {
      modelName: "Address",
      calledMethod: "getCities",
      apiKey: apiKey,
    });

    return response.data;
  } catch (error) {
    console.error("Error fetch ing cities:", error);
  }
}

async function searchCities(query) {
  try {
    const response = await axios.post(baseUrl, {
      modelName: "Address",
      calledMethod: "getCities",
      apiKey: apiKey,
      methodProperties: {
        FindByString: query,
        Limit: 5,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error searching cities:", error);
  }
}

async function getWarehouses(cityRef, searchQuery, type) {
  try {
    const response = await axios.post(baseUrl, {
      modelName: "AddressGeneral",
      calledMethod: "getWarehouses",
      apiKey: apiKey,
      methodProperties: {
        CityRef: cityRef,
        Limit: 100,
        Page: "1",
        FindByString: searchQuery,
        TypeOfWarehouseRef: type,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching warehouses:", error);
  }
}

module.exports = { getCities, searchCities, getWarehouses };
