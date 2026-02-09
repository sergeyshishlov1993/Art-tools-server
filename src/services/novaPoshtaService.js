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
    static async getTrackingInfo(ttn) {
        try {
            const response = await axios.post(BASE_URL, {
                apiKey: API_KEY,
                modelName: 'TrackingDocument',
                calledMethod: 'getStatusDocuments',
                methodProperties: {
                    Documents: [{ DocumentNumber: String(ttn).trim() }]
                }
            });

            if (response.data.success && response.data.data.length > 0) {
                return response.data.data[0];
            }

            return null;
        } catch (error) {
            console.error('[NovaPoshta] Error tracking:', error.message);
            throw error;
        }
    }

    static async getMultipleTrackingInfo(ttnList) {
        try {
            if (!ttnList || ttnList.length === 0) {
                return [];
            }

            const documents = ttnList.map(ttn => ({
                DocumentNumber: String(ttn).trim()
            }));

            const response = await axios.post(BASE_URL, {
                apiKey: API_KEY,
                modelName: 'TrackingDocument',
                calledMethod: 'getStatusDocuments',
                methodProperties: {
                    Documents: documents
                }
            });

            if (response.data.success) {
                return response.data.data;
            }

            return [];
        } catch (error) {
            console.error('[NovaPoshta] Error multiple tracking:', error.message);
            throw error;
        }
    }
    static mapNovaPoshtaStatus(npStatusCode) {
        const code = String(npStatusCode);

        if (code === '1') return 'processing';
        if (code === '2') return 'cancelled';
        if (code === '3') return null;
        if (['4', '41', '5', '6', '12', '14'].includes(code)) {
            return 'shipped';
        }
        if (['7', '8'].includes(code)) {
            return 'delivered';
        }
        if (['9', '10', '11'].includes(code)) {
            return 'completed';
        }
        if (['101', '106'].includes(code)) {
            return 'completed';
        }

        if (['102', '103', '104', '105', '108', '109', '110'].includes(code)) {
            return 'returned';
        }

        return null;
    }
    static getStatusDescription(npStatusCode) {
        const code = String(npStatusCode);

        const descriptions = {
            '1': 'Створено ТТН',
            '2': 'Видалено',
            '3': 'Номер не знайдено',
            '4': 'Відправлено',
            '41': 'В дорозі',
            '5': 'Прямує на склад',
            '6': 'На складі відправника',
            '7': 'На складі отримувача',
            '8': 'Очікує отримання',
            '9': 'Отримано',
            '10': 'Отримано',
            '11': 'Отримано',
            '12': 'Комплектується',
            '14': 'Передано підрядчику',
            '101': 'Гроші в дорозі',
            '102': 'Відмова',
            '103': 'Повернення',
            '104': 'Повертається',
            '105': 'Закінчилось зберігання',
            '106': 'Гроші виплачено',
            '108': 'Повернено відправнику',
            '109': 'Знищено',
            '110': 'Отримано повернення'
        };

        return descriptions[code] || 'Невідомий статус';
    }
}

module.exports = NovaPoshtaService;
