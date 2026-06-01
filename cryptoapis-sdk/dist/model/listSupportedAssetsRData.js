"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSupportedAssetsRData = void 0;
var ListSupportedAssetsRData = (function () {
    function ListSupportedAssetsRData() {
    }
    ListSupportedAssetsRData.getAttributeTypeMap = function () {
        return ListSupportedAssetsRData.attributeTypeMap;
    };
    ListSupportedAssetsRData.discriminator = undefined;
    ListSupportedAssetsRData.attributeTypeMap = [
        {
            "name": "limit",
            "baseName": "limit",
            "type": "number"
        },
        {
            "name": "offset",
            "baseName": "offset",
            "type": "number"
        },
        {
            "name": "total",
            "baseName": "total",
            "type": "number"
        },
        {
            "name": "items",
            "baseName": "items",
            "type": "Array<ListSupportedAssetsRI>"
        }
    ];
    return ListSupportedAssetsRData;
}());
exports.ListSupportedAssetsRData = ListSupportedAssetsRData;
//# sourceMappingURL=listSupportedAssetsRData.js.map