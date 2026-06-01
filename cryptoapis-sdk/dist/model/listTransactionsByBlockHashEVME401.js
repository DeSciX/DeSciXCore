"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashEVME401 = void 0;
var ListTransactionsByBlockHashEVME401 = (function () {
    function ListTransactionsByBlockHashEVME401() {
    }
    ListTransactionsByBlockHashEVME401.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashEVME401.attributeTypeMap;
    };
    ListTransactionsByBlockHashEVME401.discriminator = undefined;
    ListTransactionsByBlockHashEVME401.attributeTypeMap = [
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
    return ListTransactionsByBlockHashEVME401;
}());
exports.ListTransactionsByBlockHashEVME401 = ListTransactionsByBlockHashEVME401;
//# sourceMappingURL=listTransactionsByBlockHashEVME401.js.map