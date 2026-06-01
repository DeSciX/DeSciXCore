"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionIdKaspaRI = void 0;
var GetTransactionDetailsByTransactionIdKaspaRI = (function () {
    function GetTransactionDetailsByTransactionIdKaspaRI() {
    }
    GetTransactionDetailsByTransactionIdKaspaRI.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionIdKaspaRI.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionIdKaspaRI.discriminator = undefined;
    GetTransactionDetailsByTransactionIdKaspaRI.attributeTypeMap = [
        {
            "name": "blocksHashes",
            "baseName": "blocksHashes",
            "type": "Array<string>"
        },
        {
            "name": "fee",
            "baseName": "fee",
            "type": "GetTransactionDetailsByTransactionIdKaspaRIFee"
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
            "type": "Array<GetTransactionDetailsByTransactionIdKaspaRIInputsInner>"
        },
        {
            "name": "outputs",
            "baseName": "outputs",
            "type": "Array<GetTransactionDetailsByTransactionIdKaspaRIOutputsInner>"
        },
        {
            "name": "timestamp",
            "baseName": "timestamp",
            "type": "number"
        }
    ];
    return GetTransactionDetailsByTransactionIdKaspaRI;
}());
exports.GetTransactionDetailsByTransactionIdKaspaRI = GetTransactionDetailsByTransactionIdKaspaRI;
//# sourceMappingURL=getTransactionDetailsByTransactionIdKaspaRI.js.map