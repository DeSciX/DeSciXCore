"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensTransfersByTransactionHashEVMRData = void 0;
var ListTokensTransfersByTransactionHashEVMRData = (function () {
    function ListTokensTransfersByTransactionHashEVMRData() {
    }
    ListTokensTransfersByTransactionHashEVMRData.getAttributeTypeMap = function () {
        return ListTokensTransfersByTransactionHashEVMRData.attributeTypeMap;
    };
    ListTokensTransfersByTransactionHashEVMRData.discriminator = undefined;
    ListTokensTransfersByTransactionHashEVMRData.attributeTypeMap = [
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
            "type": "Array<ListTokensTransfersByTransactionHashEVMRI>"
        }
    ];
    return ListTokensTransfersByTransactionHashEVMRData;
}());
exports.ListTokensTransfersByTransactionHashEVMRData = ListTokensTransfersByTransactionHashEVMRData;
//# sourceMappingURL=listTokensTransfersByTransactionHashEVMRData.js.map