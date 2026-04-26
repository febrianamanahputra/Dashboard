import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';
console.log('Keys:', Object.keys(firebaseRulesPlugin));
if (firebaseRulesPlugin.parsers) console.log('Parsers:', Object.keys(firebaseRulesPlugin.parsers));
if (firebaseRulesPlugin.configs) console.log('Configs:', Object.keys(firebaseRulesPlugin.configs));
