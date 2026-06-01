"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointNotAllowedForApiKey = void 0;
var EndpointNotAllowedForApiKey = (function () {
    function EndpointNotAllowedForApiKey() {
    }
    EndpointNotAllowedForApiKey.getAttributeTypeMap = function () {
        return EndpointNotAllowedForApiKey.attributeTypeMap;
    };
    EndpointNotAllowedForApiKey.discriminator = undefined;
    EndpointNotAllowedForApiKey.attributeTypeMap = [
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
    return EndpointNotAllowedForApiKey;
}());
exports.EndpointNotAllowedForApiKey = EndpointNotAllowedForApiKey;
//# sourceMappingURL=endpointNotAllowedForApiKey.js.map