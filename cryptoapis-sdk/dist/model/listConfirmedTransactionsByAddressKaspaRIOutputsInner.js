"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressKaspaRIOutputsInner = void 0;
var ListConfirmedTransactionsByAddressKaspaRIOutputsInner = (function () {
    function ListConfirmedTransactionsByAddressKaspaRIOutputsInner() {
    }
    ListConfirmedTransactionsByAddressKaspaRIOutputsInner.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressKaspaRIOutputsInner.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressKaspaRIOutputsInner.discriminator = undefined;
    ListConfirmedTransactionsByAddressKaspaRIOutputsInner.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "ListConfirmedTransactionsByAddressKaspaRIOutputsInnerValue"
        }
    ];
    return ListConfirmedTransactionsByAddressKaspaRIOutputsInner;
}());
exports.ListConfirmedTransactionsByAddressKaspaRIOutputsInner = ListConfirmedTransactionsByAddressKaspaRIOutputsInner;
//# sourceMappingURL=listConfirmedTransactionsByAddressKaspaRIOutputsInner.js.map