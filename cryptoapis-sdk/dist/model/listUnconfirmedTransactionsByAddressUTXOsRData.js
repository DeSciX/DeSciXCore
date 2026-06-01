"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUnconfirmedTransactionsByAddressUTXOsRData = void 0;
var ListUnconfirmedTransactionsByAddressUTXOsRData = (function () {
    function ListUnconfirmedTransactionsByAddressUTXOsRData() {
    }
    ListUnconfirmedTransactionsByAddressUTXOsRData.getAttributeTypeMap = function () {
        return ListUnconfirmedTransactionsByAddressUTXOsRData.attributeTypeMap;
    };
    ListUnconfirmedTransactionsByAddressUTXOsRData.discriminator = undefined;
    ListUnconfirmedTransactionsByAddressUTXOsRData.attributeTypeMap = [
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
            "type": "Array<ListUnconfirmedTransactionsByAddressUTXOsRI>"
        }
    ];
    return ListUnconfirmedTransactionsByAddressUTXOsRData;
}());
exports.ListUnconfirmedTransactionsByAddressUTXOsRData = ListUnconfirmedTransactionsByAddressUTXOsRData;
//# sourceMappingURL=listUnconfirmedTransactionsByAddressUTXOsRData.js.map