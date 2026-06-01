"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewUnconfirmedCoinsTransactionsE400 = void 0;
var NewUnconfirmedCoinsTransactionsE400 = (function () {
    function NewUnconfirmedCoinsTransactionsE400() {
    }
    NewUnconfirmedCoinsTransactionsE400.getAttributeTypeMap = function () {
        return NewUnconfirmedCoinsTransactionsE400.attributeTypeMap;
    };
    NewUnconfirmedCoinsTransactionsE400.discriminator = undefined;
    NewUnconfirmedCoinsTransactionsE400.attributeTypeMap = [
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
    return NewUnconfirmedCoinsTransactionsE400;
}());
exports.NewUnconfirmedCoinsTransactionsE400 = NewUnconfirmedCoinsTransactionsE400;
//# sourceMappingURL=newUnconfirmedCoinsTransactionsE400.js.map