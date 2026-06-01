"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashEVME400 = void 0;
var ListTransactionsByBlockHashEVME400 = (function () {
    function ListTransactionsByBlockHashEVME400() {
    }
    ListTransactionsByBlockHashEVME400.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashEVME400.attributeTypeMap;
    };
    ListTransactionsByBlockHashEVME400.discriminator = undefined;
    ListTransactionsByBlockHashEVME400.attributeTypeMap = [
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
    return ListTransactionsByBlockHashEVME400;
}());
exports.ListTransactionsByBlockHashEVME400 = ListTransactionsByBlockHashEVME400;
//# sourceMappingURL=listTransactionsByBlockHashEVME400.js.map