"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressKaspaRIFee = void 0;
var ListConfirmedTransactionsByAddressKaspaRIFee = (function () {
    function ListConfirmedTransactionsByAddressKaspaRIFee() {
    }
    ListConfirmedTransactionsByAddressKaspaRIFee.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressKaspaRIFee.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressKaspaRIFee.discriminator = undefined;
    ListConfirmedTransactionsByAddressKaspaRIFee.attributeTypeMap = [
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
    return ListConfirmedTransactionsByAddressKaspaRIFee;
}());
exports.ListConfirmedTransactionsByAddressKaspaRIFee = ListConfirmedTransactionsByAddressKaspaRIFee;
//# sourceMappingURL=listConfirmedTransactionsByAddressKaspaRIFee.js.map