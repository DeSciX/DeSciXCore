"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestLimitReached = void 0;
var RequestLimitReached = (function () {
    function RequestLimitReached() {
    }
    RequestLimitReached.getAttributeTypeMap = function () {
        return RequestLimitReached.attributeTypeMap;
    };
    RequestLimitReached.discriminator = undefined;
    RequestLimitReached.attributeTypeMap = [
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
    return RequestLimitReached;
}());
exports.RequestLimitReached = RequestLimitReached;
//# sourceMappingURL=requestLimitReached.js.map