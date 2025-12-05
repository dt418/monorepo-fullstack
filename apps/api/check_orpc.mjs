import { os } from '@orpc/server';

console.log('os keys:', Object.keys(os));
console.log('os prototype keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(os)));
