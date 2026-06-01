"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureMainnetsNotAllowedForPlan = void 0;
var FeatureMainnetsNotAllowedForPlan = (function () {
    function FeatureMainnetsNotAllowedForPlan() {
    }
    FeatureMainnetsNotAllowedForPlan.getAttributeTypeMap = function () {
        return FeatureMainnetsNotAllowedForPlan.attributeTypeMap;
    };
    FeatureMainnetsNotAllowedForPlan.discriminator = undefined;
    FeatureMainnetsNotAllowedForPlan.attributeTypeMap = [
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
    return FeatureMainnetsNotAllowedForPlan;
}());
exports.FeatureMainnetsNotAllowedForPlan = FeatureMainnetsNotAllowedForPlan;
//# sourceMappingURL=featureMainnetsNotAllowedForPlan.js.map