"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedTokensTransactionsAndEachConfirmationE409 = void 0;
var NewConfirmedTokensTransactionsAndEachConfirmationE409 = (function () {
    function NewConfirmedTokensTransactionsAndEachConfirmationE409() {
    }
    NewConfirmedTokensTransactionsAndEachConfirmationE409.getAttributeTypeMap = function () {
        return NewConfirmedTokensTransactionsAndEachConfirmationE409.attributeTypeMap;
    };
    NewConfirmedTokensTransactionsAndEachConfirmationE409.discriminator = undefined;
    NewConfirmedTokensTransactionsAndEachConfirmationE409.attributeTypeMap = [
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
    return NewConfirmedTokensTransactionsAndEachConfirmationE409;
}());
exports.NewConfirmedTokensTransactionsAndEachConfirmationE409 = NewConfirmedTokensTransactionsAndEachConfirmationE409;
//# sourceMappingURL=newConfirmedTokensTransactionsAndEachConfirmationE409.js.map