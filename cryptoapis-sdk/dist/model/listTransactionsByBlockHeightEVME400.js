"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightEVME400 = void 0;
var ListTransactionsByBlockHeightEVME400 = (function () {
    function ListTransactionsByBlockHeightEVME400() {
    }
    ListTransactionsByBlockHeightEVME400.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightEVME400.attributeTypeMap;
    };
    ListTransactionsByBlockHeightEVME400.discriminator = undefined;
    ListTransactionsByBlockHeightEVME400.attributeTypeMap = [
        {
            "name": "code",
            "baseName": "code",
            "type": "string"
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "string"
        },
        {
            "name": "details",
            "baseName": "details",
            "type": "Array<BannedIpAddressDetailsInner>"
        }
    ];
    return ListTransactionsByBlockHeightEVME400;
}());
exports.ListTransactionsByBlockHeightEVME400 = ListTransactionsByBlockHeightEVME400;
//# sourceMappingURL=listTransactionsByBlockHeightEVME400.js.map