"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressUTXO403Response = void 0;
var ValidateAddressUTXO403Response = (function () {
    function ValidateAddressUTXO403Response() {
    }
    ValidateAddressUTXO403Response.getAttributeTypeMap = function () {
        return ValidateAddressUTXO403Response.attributeTypeMap;
    };
    ValidateAddressUTXO403Response.discriminator = undefined;
    ValidateAddressUTXO403Response.attributeTypeMap = [
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
            "name": "error",
            "baseName": "error",
            "type": "ValidateAddressUTXOE403"
        }
    ];
    return ValidateAddressUTXO403Response;
}());
exports.ValidateAddressUTXO403Response = ValidateAddressUTXO403Response;
//# sourceMappingURL=validateAddressUTXO403Response.js.map