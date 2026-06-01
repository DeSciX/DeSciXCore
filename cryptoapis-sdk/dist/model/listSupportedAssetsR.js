"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSupportedAssetsR = void 0;
var ListSupportedAssetsR = (function () {
    function ListSupportedAssetsR() {
    }
    ListSupportedAssetsR.getAttributeTypeMap = function () {
        return ListSupportedAssetsR.attributeTypeMap;
    };
    ListSupportedAssetsR.discriminator = undefined;
    ListSupportedAssetsR.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "ListSupportedAssetsRData"
        }
    ];
    return ListSupportedAssetsR;
}());
exports.ListSupportedAssetsR = ListSupportedAssetsR;
//# sourceMappingURL=listSupportedAssetsR.js.map