"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var service1, service2, service3, i, futureSaturday, specialDateStr, futureFriday, blockedDateStr;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Start seeding ...");
                    // Clean existing data (optional, but good for repeatable seeds)
                    return [4 /*yield*/, prisma.service.deleteMany({})];
                case 1:
                    // Clean existing data (optional, but good for repeatable seeds)
                    _a.sent();
                    console.log('Deleted existing services.');
                    return [4 /*yield*/, prisma.service.create({
                            data: {
                                title: 'Holistic Massage',
                                titleEn: 'Holistic Massage',
                                titleFi: 'Holistinen hieronta',
                                description: 'A relaxing full body massage.',
                                descriptionEn: 'A relaxing full body massage.',
                                descriptionFi: 'Rentouttava kokovartalohieronta.',
                                duration: 75, // minutes
                                price: 85.00,
                                currency: 'EUR',
                                color: '#6366F1', // Indigo
                                active: true,
                                order: 1,
                            },
                        })];
                case 2:
                    service1 = _a.sent();
                    return [4 /*yield*/, prisma.service.create({
                            data: {
                                title: 'Energy Healing Session',
                                titleEn: 'Energy Healing Session',
                                titleFi: 'Energiahoito',
                                description: 'Balancing your body\'s energy fields.',
                                descriptionEn: 'Balancing your body\'s energy fields.',
                                descriptionFi: 'Kehon energiakenttien tasapainotus.',
                                duration: 60,
                                price: 70.00,
                                currency: 'EUR',
                                color: '#EC4899', // Pink
                                active: true,
                                order: 2,
                            },
                        })];
                case 3:
                    service2 = _a.sent();
                    return [4 /*yield*/, prisma.service.create({
                            data: {
                                title: 'Consultation',
                                titleEn: 'Consultation',
                                titleFi: 'Konsultaatio',
                                description: 'Initial consultation (inactive example).',
                                descriptionEn: 'Initial consultation (inactive example).',
                                descriptionFi: 'Alkukonsultaatio (ei aktiivinen esimerkki).',
                                duration: 30,
                                price: 40.00,
                                currency: 'EUR',
                                color: '#8B5CF6', // Violet
                                active: false, // Example of an inactive service
                                order: 3,
                            },
                        })];
                case 4:
                    service3 = _a.sent();
                    // Clean existing availability settings
                    return [4 /*yield*/, prisma.regularHours.deleteMany({})];
                case 5:
                    // Clean existing availability settings
                    _a.sent();
                    return [4 /*yield*/, prisma.specialDate.deleteMany({})];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, prisma.blockedDate.deleteMany({})];
                case 7:
                    _a.sent();
                    console.log('Deleted existing availability settings.');
                    i = 1;
                    _a.label = 8;
                case 8:
                    if (!(i <= 5)) return [3 /*break*/, 11];
                    return [4 /*yield*/, prisma.regularHours.create({
                            data: {
                                dayOfWeek: i,
                                startTime: '09:00:00',
                                endTime: '17:00:00',
                                isAvailable: true,
                            },
                        })];
                case 9:
                    _a.sent();
                    _a.label = 10;
                case 10:
                    i++;
                    return [3 /*break*/, 8];
                case 11: 
                // Example: Saturday closed
                return [4 /*yield*/, prisma.regularHours.create({
                        data: {
                            dayOfWeek: 6, // Saturday
                            startTime: '00:00:00',
                            endTime: '00:00:00',
                            isAvailable: false,
                        },
                    })];
                case 12:
                    // Example: Saturday closed
                    _a.sent();
                    // Example: Sunday closed
                    return [4 /*yield*/, prisma.regularHours.create({
                            data: {
                                dayOfWeek: 0, // Sunday
                                startTime: '00:00:00',
                                endTime: '00:00:00',
                                isAvailable: false,
                            },
                        })];
                case 13:
                    // Example: Sunday closed
                    _a.sent();
                    console.log('Seeded regular hours.');
                    futureSaturday = new Date();
                    futureSaturday.setDate(futureSaturday.getDate() + (6 - futureSaturday.getDay() + 7) % 7 + 7); // Next non-immediate Saturday
                    specialDateStr = futureSaturday.toISOString().split('T')[0];
                    return [4 /*yield*/, prisma.specialDate.create({
                            data: {
                                date: specialDateStr,
                                startTime: '10:00:00',
                                endTime: '14:00:00',
                                isAvailable: true,
                            },
                        })];
                case 14:
                    _a.sent();
                    console.log("Seeded special date for ".concat(specialDateStr, "."));
                    futureFriday = new Date();
                    futureFriday.setDate(futureFriday.getDate() + (5 - futureFriday.getDay() + 7) % 7 + 14); // A Friday >2 weeks away
                    blockedDateStr = futureFriday.toISOString().split('T')[0];
                    return [4 /*yield*/, prisma.blockedDate.create({
                            data: {
                                date: blockedDateStr,
                                reason: 'Team training day',
                            },
                        })];
                case 15:
                    _a.sent();
                    console.log("Seeded blocked date for ".concat(blockedDateStr, "."));
                    console.log("Seeding finished.");
                    console.log({ service1: service1, service2: service2, service3: service3 });
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
