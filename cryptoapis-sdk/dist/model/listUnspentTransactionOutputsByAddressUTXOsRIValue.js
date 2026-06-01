"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUnspentTransactionOutputsByAddressUTXOsRIValue = void 0;
var ListUnspentTransactionOutputsByAddressUTXOsRIValue = (function () {
    function ListUnspentTransactionOutputsByAddressUTXOsRIValue() {
    }
    ListUnspentTransactionOutputsByAddressUTXOsRIValue.getAttributeTypeMap = function () {
        return ListUnspentTransactionOutputsByAddressUTXOsRIValue.attributeTypeMap;
    };
    ListUnspentTransactionOutputsByAddressUTXOsRIValue.discriminator = undefined;
    ListUnspentTransactionOutputsByAddressUTXOsRIValue.attributeTypeMap = [
        {
            "name": "amount",
            "baseName": "amount",
            "type": "string"
        },
        {
            "name": "denomination",
            "baseName": "denomination",
            "type": "number"
        },
        {
            "name": "unit",
            "baseName": "unit",
            "type": "string"
        }
    ];
    return ListUnspentTransactionOutputsByAddressUTXOsRIValue;
}());
exports.ListUnspentTransactionOutputsByAddressUTXOsRIValue = ListUnspentTransactionOutputsByAddressUTXOsRIValue;
//# sourceMappingURL=listUnspentTransactionOutputsByAddressUTXOsRIValue.js.map