"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUnspentTransactionOutputsByAddressUTXOsRData = void 0;
var ListUnspentTransactionOutputsByAddressUTXOsRData = (function () {
    function ListUnspentTransactionOutputsByAddressUTXOsRData() {
    }
    ListUnspentTransactionOutputsByAddressUTXOsRData.getAttributeTypeMap = function () {
        return ListUnspentTransactionOutputsByAddressUTXOsRData.attributeTypeMap;
    };
    ListUnspentTransactionOutputsByAddressUTXOsRData.discriminator = undefined;
    ListUnspentTransactionOutputsByAddressUTXOsRData.attributeTypeMap = [
        {
            "name": "limit",
            "baseName": "limit",
            "type": "number"
        },
        {
            "name": "offset",
            "baseName": "offset",
            "type": "number"
        },
        {
            "name": "total",
            "baseName": "total",
            "type": "number"
        },
        {
            "name": "items",
            "baseName": "items",
            "type": "Array<ListUnspentTransactionOutputsByAddressUTXOsRI>"
        }
    ];
    return ListUnspentTransactionOutputsByAddressUTXOsRData;
}());
exports.ListUnspentTransactionOutputsByAddressUTXOsRData = ListUnspentTransactionOutputsByAddressUTXOsRData;
//# sourceMappingURL=listUnspentTransactionOutputsByAddressUTXOsRData.js.map