const axios = require('axios');

const API_KEY = process.env.NOVA_POSHTA_API_KEY || 'e9c3b2475b54bc1d3033f11ad5b20c26';
const BASE_URL = 'https://api.novaposhta.ua/v2.0/json/';

class NovaPoshtaService {
    static async getCities() {
        try {
            const response = await axios.post(BASE_URL, {
                modelName: 'Address',
                calledMethod: 'getCities',
                apiKey: API_KEY
            });
            return response.data;
        } catch (error) {
            console.error('[NovaPoshta] Error fetching cities:', error.message);
            throw error;
        }
    }

    static async searchCities(query) {
        try {
            const response = await axios.post(BASE_URL, {
                modelName: 'Address',
                calledMethod: 'getCities',
                apiKey: API_KEY,
                methodProperties: {
                    FindByString: query,
                    Limit: 5
                }
            });
            return response.data;
        } catch (error) {
            console.error('[NovaPoshta] Error searching cities:', error.message);
            throw error;
        }
    }

    static async getWarehouses(cityRef, searchQuery = '', type = '') {
        try {
            const response = await axios.post(BASE_URL, {
                modelName: 'AddressGeneral',
                calledMethod: 'getWarehouses',
                apiKey: API_KEY,
                methodProperties: {
                    CityRef: cityRef,
                    Limit: 100,
                    Page: '1',
                    FindByString: searchQuery,
                    TypeOfWarehouseRef: type
                }
            });
            return response.data;
        } catch (error) {
            console.error('[NovaPoshta] Error fetching warehouses:', error.message);
            throw error;
        }
    }

    static async getWarehousesByCityName(cityName, searchQuery = '') {
        try {
            const response = await axios.post(BASE_URL, {
                modelName: 'AddressGeneral',
                calledMethod: 'getWarehouses',
                apiKey: API_KEY,
                methodProperties: {
                    CityName: cityName,
                    FindByString: searchQuery,
                    Limit: 20,
                    Page: '1'
                }
            });
            return response.data;
        } catch (error) {
            console.error('[NovaPoshta] Error fetching warehouses:', error.message);
            throw error;
        }
    }
}

module.exports = NovaPoshtaService;
