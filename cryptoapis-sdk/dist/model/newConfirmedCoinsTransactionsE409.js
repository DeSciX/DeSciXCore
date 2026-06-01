"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedCoinsTransactionsE409 = void 0;
var NewConfirmedCoinsTransactionsE409 = (function () {
    function NewConfirmedCoinsTransactionsE409() {
    }
    NewConfirmedCoinsTransactionsE409.getAttributeTypeMap = function () {
        return NewConfirmedCoinsTransactionsE409.attributeTypeMap;
    };
    NewConfirmedCoinsTransactionsE409.discriminator = undefined;
    NewConfirmedCoinsTransactionsE409.attributeTypeMap = [
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
    return NewConfirmedCoinsTransactionsE409;
}());
exports.NewConfirmedCoinsTransactionsE409 = NewConfirmedCoinsTransactionsE409;
//# sourceMappingURL=newConfirmedCoinsTransactionsE409.js.map