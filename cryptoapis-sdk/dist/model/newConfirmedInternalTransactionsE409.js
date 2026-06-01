"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedInternalTransactionsE409 = void 0;
var NewConfirmedInternalTransactionsE409 = (function () {
    function NewConfirmedInternalTransactionsE409() {
    }
    NewConfirmedInternalTransactionsE409.getAttributeTypeMap = function () {
        return NewConfirmedInternalTransactionsE409.attributeTypeMap;
    };
    NewConfirmedInternalTransactionsE409.discriminator = undefined;
    NewConfirmedInternalTransactionsE409.attributeTypeMap = [
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
    return NewConfirmedInternalTransactionsE409;
}());
exports.NewConfirmedInternalTransactionsE409 = NewConfirmedInternalTransactionsE409;
//# sourceMappingURL=newConfirmedInternalTransactionsE409.js.map