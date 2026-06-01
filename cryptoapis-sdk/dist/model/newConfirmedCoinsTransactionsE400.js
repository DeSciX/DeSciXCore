"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedCoinsTransactionsE400 = void 0;
var NewConfirmedCoinsTransactionsE400 = (function () {
    function NewConfirmedCoinsTransactionsE400() {
    }
    NewConfirmedCoinsTransactionsE400.getAttributeTypeMap = function () {
        return NewConfirmedCoinsTransactionsE400.attributeTypeMap;
    };
    NewConfirmedCoinsTransactionsE400.discriminator = undefined;
    NewConfirmedCoinsTransactionsE400.attributeTypeMap = [
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
    return NewConfirmedCoinsTransactionsE400;
}());
exports.NewConfirmedCoinsTransactionsE400 = NewConfirmedCoinsTransactionsE400;
//# sourceMappingURL=newConfirmedCoinsTransactionsE400.js.map