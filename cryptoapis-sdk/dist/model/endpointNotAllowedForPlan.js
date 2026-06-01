"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointNotAllowedForPlan = void 0;
var EndpointNotAllowedForPlan = (function () {
    function EndpointNotAllowedForPlan() {
    }
    EndpointNotAllowedForPlan.getAttributeTypeMap = function () {
        return EndpointNotAllowedForPlan.attributeTypeMap;
    };
    EndpointNotAllowedForPlan.discriminator = undefined;
    EndpointNotAllowedForPlan.attributeTypeMap = [
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
    return EndpointNotAllowedForPlan;
}());
exports.EndpointNotAllowedForPlan = EndpointNotAllowedForPlan;
//# sourceMappingURL=endpointNotAllowedForPlan.js.map