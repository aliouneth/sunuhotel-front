/** @type {import('jest').Config} */
const config = {
    testEnvironment: "jest-environment-jsdom",
    testMatch: [
        "<rootDir>/src/**/*.test.ts",
        "<rootDir>/src/**/*.test.tsx",
        "<rootDir>/src/**/*.spec.ts",
        "<rootDir>/src/**/*.spec.tsx",
    ],
    moduleNameMapper: {
        "^@/components/(.*)$": "<rootDir>/src/components/$1",
        "^@/lib/(.*)$": "<rootDir>/src/lib/$1",
        "^@/src/(.*)$": "<rootDir>/src/$1",
        "^@/context/(.*)$": "<rootDir>/src/context/$1",
        "^@/types/(.*)$": "<rootDir>/src/types/$1",
        "^@/app/(.*)$": "<rootDir>/src/app/$1",
        "^@/i18n/(.*)$": "<rootDir>/src/i18n/$1",
        "\\.(css|less|sass|scss)$": "identity-obj-proxy",
        "\\.(jpg|jpeg|png|svg|gif|eot|otf|ttf|woff|woff2)$": "url-loader",
    },
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    collectCoverageFrom: [],
};

module.exports = config;