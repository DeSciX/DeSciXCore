"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnexpectedServerError = void 0;
var UnexpectedServerError = (function () {
    function UnexpectedServerError() {
    }
    UnexpectedServerError.getAttributeTypeMap = function () {
        return UnexpectedServerError.attributeTypeMap;
    };
    UnexpectedServerError.discriminator = undefined;
    UnexpectedServerError.attributeTypeMap = [
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
    return UnexpectedServerError;
}());
exports.UnexpectedServerError = UnexpectedServerError;
//# sourceMappingURL=unexpectedServerError.js.map