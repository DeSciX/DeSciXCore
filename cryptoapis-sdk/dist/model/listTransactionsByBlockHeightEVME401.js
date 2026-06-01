"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightEVME401 = void 0;
var ListTransactionsByBlockHeightEVME401 = (function () {
    function ListTransactionsByBlockHeightEVME401() {
    }
    ListTransactionsByBlockHeightEVME401.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightEVME401.attributeTypeMap;
    };
    ListTransactionsByBlockHeightEVME401.discriminator = undefined;
    ListTransactionsByBlockHeightEVME401.attributeTypeMap = [
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
    return ListTransactionsByBlockHeightEVME401;
}());
exports.ListTransactionsByBlockHeightEVME401 = ListTransactionsByBlockHeightEVME401;
//# sourceMappingURL=listTransactionsByBlockHeightEVME401.js.map