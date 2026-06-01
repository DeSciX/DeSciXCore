"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedCoinsTransactionsAndEachConfirmationE401 = void 0;
var NewConfirmedCoinsTransactionsAndEachConfirmationE401 = (function () {
    function NewConfirmedCoinsTransactionsAndEachConfirmationE401() {
    }
    NewConfirmedCoinsTransactionsAndEachConfirmationE401.getAttributeTypeMap = function () {
        return NewConfirmedCoinsTransactionsAndEachConfirmationE401.attributeTypeMap;
    };
    NewConfirmedCoinsTransactionsAndEachConfirmationE401.discriminator = undefined;
    NewConfirmedCoinsTransactionsAndEachConfirmationE401.attributeTypeMap = [
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
    return NewConfirmedCoinsTransactionsAndEachConfirmationE401;
}());
exports.NewConfirmedCoinsTransactionsAndEachConfirmationE401 = NewConfirmedCoinsTransactionsAndEachConfirmationE401;
//# sourceMappingURL=newConfirmedCoinsTransactionsAndEachConfirmationE401.js.map