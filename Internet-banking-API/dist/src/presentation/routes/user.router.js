"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.user = void 0;
require("reflect-metadata");
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const controllers_1 = require("../controllers");
const middleware_1 = require("../middleware");
exports.user = (0, express_1.Router)();
const controller = tsyringe_1.container.resolve(controllers_1.UserController);
exports.user.get('/list', middleware_1.adminValidation, controller.GetAll);
exports.user.get('/get/:id', middleware_1.ownerValidation, controller.Get);
exports.user.get('/get/:email', controller.GetByEmail);
exports.user.get('/get/:username', controller.GetByUsername);
exports.user.delete('/delete/:id', middleware_1.adminValidation, controller.Delete);
