"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressKaspaRI = void 0;
var ListConfirmedTransactionsByAddressKaspaRI = (function () {
    function ListConfirmedTransactionsByAddressKaspaRI() {
    }
    ListConfirmedTransactionsByAddressKaspaRI.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressKaspaRI.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressKaspaRI.discriminator = undefined;
    ListConfirmedTransactionsByAddressKaspaRI.attributeTypeMap = [
        {
            "name": "blocksHashes",
            "baseName": "blocksHashes",
            "type": "Array<string>"
        },
        {
            "name": "fee",
            "baseName": "fee",
            "type": "ListConfirmedTransactionsByAddressKaspaRIFee"
        },
        {
            "name": "hash",
            "baseName": "hash",
            "type": "string"
        },
        {
            "name": "id",
            "baseName": "id",
            "type": "string"
        },
        {
            "name": "inputs",
            "baseName": "inputs",
            "type": "Array<ListConfirmedTransactionsByAddressKaspaRIInputsInner>"
        },
        {
            "name": "outputs",
            "baseName": "outputs",
            "type": "Array<ListConfirmedTransactionsByAddressKaspaRIOutputsInner>"
        },
        {
            "name": "timestamp",
            "baseName": "timestamp",
            "type": "number"
        }
    ];
    return ListConfirmedTransactionsByAddressKaspaRI;
}());
exports.ListConfirmedTransactionsByAddressKaspaRI = ListConfirmedTransactionsByAddressKaspaRI;
//# sourceMappingURL=listConfirmedTransactionsByAddressKaspaRI.js.map