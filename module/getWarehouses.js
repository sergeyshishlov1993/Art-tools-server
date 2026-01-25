const axios = require("axios");
const { baseUrl, apiKey } = require("./nova-poshta");

async function getWarehouses(city, numberWarehouses) {
  try {
    const response = await axios.post(baseUrl, {
      modelName: "AddressGeneral",
      calledMethod: "getWarehouses",
      apiKey: apiKey,
      methodProperties: {
        FindByString: numberWarehouses,
        CityName: city,
        Limit: 20,
        Page: "1",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching warehouses:", error);
  }
}
