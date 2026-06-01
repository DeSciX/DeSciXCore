"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedCoinsTransactionsAndEachConfirmationE409 = void 0;
var NewConfirmedCoinsTransactionsAndEachConfirmationE409 = (function () {
    function NewConfirmedCoinsTransactionsAndEachConfirmationE409() {
    }
    NewConfirmedCoinsTransactionsAndEachConfirmationE409.getAttributeTypeMap = function () {
        return NewConfirmedCoinsTransactionsAndEachConfirmationE409.attributeTypeMap;
    };
    NewConfirmedCoinsTransactionsAndEachConfirmationE409.discriminator = undefined;
    NewConfirmedCoinsTransactionsAndEachConfirmationE409.attributeTypeMap = [
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
    return NewConfirmedCoinsTransactionsAndEachConfirmationE409;
}());
exports.NewConfirmedCoinsTransactionsAndEachConfirmationE409 = NewConfirmedCoinsTransactionsAndEachConfirmationE409;
//# sourceMappingURL=newConfirmedCoinsTransactionsAndEachConfirmationE409.js.map