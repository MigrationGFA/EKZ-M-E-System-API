"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const dotenv = __importStar(require("dotenv"));
const users_js_1 = require("./users.js");
const project_meta_js_1 = require("./project-meta.js");
const logframe_js_1 = require("./logframe.js");
const indicators_js_1 = require("./indicators.js");
const disaggregation_js_1 = require("./disaggregation.js");
const locations_js_1 = require("./locations.js");
const covenants_js_1 = require("./covenants.js");
const safeguards_js_1 = require("./safeguards.js");
const reset_js_1 = require("./reset.js");
dotenv.config();
const dataSource = new typeorm_1.DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [],
    synchronize: false,
});
const RESET_REQUESTED = process.env.RESET_BEFORE_SEED === 'YES';
const SEEDERS = [
    ...(RESET_REQUESTED
        ? [{ name: 'reset (destructive)', run: reset_js_1.resetAllExceptUsers }]
        : []),
    { name: 'users', run: users_js_1.seedUsers },
    { name: 'project-meta', run: project_meta_js_1.seedProjectMeta },
    { name: 'logframe', run: logframe_js_1.seedLogframe },
    { name: 'indicators', run: indicators_js_1.seedIndicators },
    { name: 'disaggregation', run: disaggregation_js_1.seedDisaggregation },
    { name: 'locations', run: locations_js_1.seedLocations },
    { name: 'covenants', run: covenants_js_1.seedCovenants },
    { name: 'safeguards', run: safeguards_js_1.seedSafeguards },
];
async function seed() {
    await dataSource.initialize();
    console.log('Connected to database');
    for (const { name, run } of SEEDERS) {
        console.log(`▶ ${name}`);
        await run(dataSource);
    }
    await dataSource.destroy();
    console.log('Seed complete');
}
seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map