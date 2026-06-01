"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewUnconfirmedCoinsTransactionsE409 = void 0;
var NewUnconfirmedCoinsTransactionsE409 = (function () {
    function NewUnconfirmedCoinsTransactionsE409() {
    }
    NewUnconfirmedCoinsTransactionsE409.getAttributeTypeMap = function () {
        return NewUnconfirmedCoinsTransactionsE409.attributeTypeMap;
    };
    NewUnconfirmedCoinsTransactionsE409.discriminator = undefined;
    NewUnconfirmedCoinsTransactionsE409.attributeTypeMap = [
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
    return NewUnconfirmedCoinsTransactionsE409;
}());
exports.NewUnconfirmedCoinsTransactionsE409 = NewUnconfirmedCoinsTransactionsE409;
//# sourceMappingURL=newUnconfirmedCoinsTransactionsE409.js.map