"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSupportedAssetsRILatestRate = void 0;
var ListSupportedAssetsRILatestRate = (function () {
    function ListSupportedAssetsRILatestRate() {
    }
    ListSupportedAssetsRILatestRate.getAttributeTypeMap = function () {
        return ListSupportedAssetsRILatestRate.attributeTypeMap;
    };
    ListSupportedAssetsRILatestRate.discriminator = undefined;
    ListSupportedAssetsRILatestRate.attributeTypeMap = [
        {
            "name": "amount",
            "baseName": "amount",
            "type": "string"
        },
        {
            "name": "calculationTimestamp",
            "baseName": "calculationTimestamp",
            "type": "number"
        },
        {
            "name": "unit",
            "baseName": "unit",
            "type": "string"
        }
    ];
    return ListSupportedAssetsRILatestRate;
}());
exports.ListSupportedAssetsRILatestRate = ListSupportedAssetsRILatestRate;
//# sourceMappingURL=listSupportedAssetsRILatestRate.js.map